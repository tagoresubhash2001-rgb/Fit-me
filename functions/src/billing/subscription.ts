import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { callableOptions, requireAuth } from '../lib/callable';
import { db, isEmulator } from '../lib/admin';
import { PAID_PLANS, PERIODS, hasAccess, trialEligible, type BillingEvent } from './billing';
import { applyBillingEvent, loadBillingMode, loadPricing, readEntitlement, trialUsedAt } from './store';

const StartInput = z.object({ plan: z.enum(PAID_PLANS), period: z.enum(PERIODS) });

/**
 * Starts the 30-day free trial (PRD section 2). Until store and Cashfree accounts exist (mode "interest"),
 * or for accounts that are not billing testers, it records the user's interest and the app says payments
 * are launching soon. In "test" mode testers get a real server-side trial (source "test") so the whole
 * entitlement lifecycle can be exercised end to end. In the native apps the purchase goes through
 * RevenueCat and arrives here via the webhook instead.
 */
export const startTrial = onCall(callableOptions(), async (req) => {
  const uid = requireAuth(req);
  const parsed = StartInput.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const { plan, period } = parsed.data;
  const mode = await loadBillingMode();
  const tester = isEmulator() || req.auth?.token.billingTester === true;

  if (mode === 'test' && tester) {
    const current = readEntitlement((await db().doc(`entitlements/${uid}`).get()).data());
    if (current && hasAccess(current, Date.now()) && current.status !== 'cancelled') throw new HttpsError('failed-precondition', 'already_subscribed');
    if (!trialEligible(await trialUsedAt(uid))) throw new HttpsError('failed-precondition', 'trial_used');
    const pricing = await loadPricing();
    const ent = await applyBillingEvent(uid, { type: 'trial_started', plan, period, at: Date.now(), trialDays: pricing.trialDays, source: 'test' });
    return { status: 'trialing' as const, trialEndsAt: ent?.trialEndsAt ?? null };
  }

  const profile = (await db().doc(`users/${uid}`).get()).data() ?? {};
  await db()
    .doc(`planInterest/${uid}`)
    .set({ uid, plan, period, currency: String(profile.currency ?? 'USD'), country: String(profile.country ?? 'US'), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { status: 'interest' as const };
});

const ManageInput = z.object({
  action: z.enum(['cancel', 'resume', 'change']),
  plan: z.enum(PAID_PLANS).optional(),
  period: z.enum(PERIODS).optional(),
});

const MANAGE_URLS: Record<string, string> = {
  appstore: 'https://apps.apple.com/account/subscriptions',
  playstore: 'https://play.google.com/store/account/subscriptions',
};

/** Manage / change plan / cancel. Store subscriptions are managed in the store; test ones here. */
export const manageSubscription = onCall(callableOptions(), async (req) => {
  const uid = requireAuth(req);
  const parsed = ManageInput.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const current = readEntitlement((await db().doc(`entitlements/${uid}`).get()).data());
  if (!current || !hasAccess(current, Date.now())) throw new HttpsError('failed-precondition', 'no_subscription');
  if (MANAGE_URLS[current.source]) return { status: 'store' as const, manageUrl: MANAGE_URLS[current.source] };
  if (current.source !== 'test') throw new HttpsError('failed-precondition', 'manage_unavailable');
  const { action, plan, period } = parsed.data;
  const at = Date.now();
  const event: BillingEvent =
    action === 'cancel'
      ? { type: 'cancelled', at }
      : action === 'resume'
        ? { type: 'uncancelled', at }
        : { type: 'plan_changed', plan: plan ?? current.plan, period: period ?? current.period ?? 'monthly', at };
  const next = await applyBillingEvent(uid, event);
  return { status: next?.status ?? current.status };
});
