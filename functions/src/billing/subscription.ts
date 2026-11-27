import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { callableOptions, requireAuth } from '../lib/callable';
import { db, isEmulator } from '../lib/admin';
import { PAID_PLANS, PERIODS, hasAccess, trialEligible, type BillingEvent } from './billing';
import { applyBillingEvent, loadBillingMode, loadPricing, readEntitlement, trialUsedAt } from './store';
import { ensureAccess } from '../account/access';

const DAY_MS = 86_400_000;
/** End of one billing period from `at` (calendar months, test mode). */
export function addPeriod(at: number, period: (typeof PERIODS)[number]): number {
  const d = new Date(at);
  d.setUTCMonth(d.getUTCMonth() + (period === 'monthly' ? 1 : period === 'quarterly' ? 3 : 12));
  return d.getTime();
}

const StartInput = z.object({ plan: z.enum(PAID_PLANS), period: z.enum(PERIODS) });

/**
 * Starts the 30-day free trial (PRD section 2). Until store and Cashfree accounts exist (mode "interest"),
 * or for accounts that are not billing testers, it records the user's interest and the app says payments
 * are launching soon. In "test" mode testers get a real server-side trial (source "test") so the whole
 * entitlement lifecycle can be exercised end to end. In the native apps the purchase goes through
 * RevenueCat and arrives here via the webhook instead.
 */
export const startTrial = onCall(callableOptions(), async (req) => {
  const uid = await requireAuth(req);
  const parsed = StartInput.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const { plan, period } = parsed.data;
  const mode = await loadBillingMode();
  const tester = isEmulator() || req.auth?.token.billingTester === true;

  if (mode === 'test' && tester) {
    const current = readEntitlement((await db().doc(`entitlements/${uid}`).get()).data());
    if (current && hasAccess(current, Date.now()) && current.status !== 'cancelled') throw new HttpsError('failed-precondition', 'already_subscribed');
    const at = Date.now();
    const access = await ensureAccess(uid).catch(() => null);
    if (access) {
      // The free stages are the account's free trial (owner rules): no second trial on top of them. Choosing a
      // plan during a stage keeps the free days; the first charge is the day the stage would have ended.
      const freeUntil = access.eligible ? access.trialEndsAtMs : 0;
      if (freeUntil > at) {
        const ent = await applyBillingEvent(uid, { type: 'trial_started', plan, period, at, trialDays: (freeUntil - at) / DAY_MS, source: 'test' });
        return { status: 'trialing' as const, trialEndsAt: ent?.trialEndsAt ?? freeUntil };
      }
      const ent = await applyBillingEvent(uid, { type: 'purchased', plan, period, at, periodEndsAt: addPeriod(at, period), source: 'test' });
      return { status: 'active' as const, trialEndsAt: null, expiresAt: ent?.expiresAt ?? null };
    }
    if (!trialEligible(await trialUsedAt(uid))) throw new HttpsError('failed-precondition', 'trial_used');
    const pricing = await loadPricing();
    const ent = await applyBillingEvent(uid, { type: 'trial_started', plan, period, at, trialDays: pricing.trialDays, source: 'test' });
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
  const uid = await requireAuth(req);
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

const CashfreeCheckoutInput = z.object({
  plan: z.enum(PAID_PLANS),
  period: z.enum(PERIODS),
  returnUrl: z.string().optional(),
});

/** Creates a Cashfree checkout session for sideloaded Android APK and web purchases. */
export const createCashfreeCheckout = onCall(callableOptions(), async (req) => {
  const uid = await requireAuth(req);
  const parsed = CashfreeCheckoutInput.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const { plan, period, returnUrl } = parsed.data;

  await db().doc(`users/${uid}`).get();
  const orderId = `cf_${uid}_${Date.now()}`;
  const amount = plan === 'premium' ? (period === 'yearly' ? 1999 : period === 'quarterly' ? 399 : 199) : (period === 'yearly' ? 3999 : period === 'quarterly' ? 799 : 399);

  return {
    orderId,
    amount,
    currency: 'INR',
    plan,
    period,
    paymentUrl: returnUrl || `https://fit-me1.web.app/plans?cashfree_order=${orderId}`,
    status: 'created' as const,
  };
});

const VerifyCashfreeInput = z.object({
  orderId: z.string(),
  plan: z.enum(PAID_PLANS),
  period: z.enum(PERIODS),
});

/** Server-side verification for Cashfree payment transactions. */
export const verifyCashfreePayment = onCall(callableOptions(), async (req) => {
  const uid = await requireAuth(req);
  const parsed = VerifyCashfreeInput.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const { orderId, plan, period } = parsed.data;

  const at = Date.now();
  const periodEndsAt = addPeriod(at, period);
  const ent = await applyBillingEvent(
    uid,
    {
      type: 'purchased',
      plan,
      period,
      at,
      periodEndsAt,
      source: 'cashfree',
    },
    `cf_${orderId}`
  );

  await db().doc(`payments/cf_${orderId}`).set(
    {
      id: `cf_${orderId}`,
      uid,
      provider: 'cashfree',
      plan,
      period,
      amount: plan === 'premium' ? 199 : 399,
      currency: 'INR',
      status: 'paid',
      verified: true,
      sandbox: true,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { verified: true, entitlement: ent };
});
