import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { callableOptions, requireAuth } from '../lib/callable';
import { db, isEmulator } from '../lib/admin';
import { PAID_PLANS, PERIODS, hasAccess, marketFor, quote, trialEligible, type BillingEvent } from './billing';
import { cashfreeCreds, createOrder, fetchOrder, makeOrderId, orderPaidFor } from './cashfree';
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
  returnUrl: z.string().max(500).nullish(),
});

/** Where Cashfree may send the user back to: this site (any path) or the app's own scheme. */
const RETURN_ORIGINS = ['https://fit-me1.web.app', 'https://fit-me1.firebaseapp.com', 'http://localhost:5173', 'capacitor://localhost', 'https://localhost'];
export function safeReturnUrl(url: string | null | undefined): string {
  const fallback = 'https://fit-me1.web.app/app/plans';
  if (!url) return fallback;
  try {
    const u = new URL(url);
    return RETURN_ORIGINS.includes(u.origin) ? u.toString() : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Starts a Cashfree checkout (web app and the direct-download Android APK). The amount comes from the server price
 * list for the user's market; the client only picks plan and period. The pending order is kept server-side in
 * billingOrders/{orderId} (no client access) so verification never trusts the client.
 */
export const createCashfreeCheckout = onCall(callableOptions(), async (req) => {
  const uid = await requireAuth(req);
  const parsed = CashfreeCheckoutInput.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const { plan, period } = parsed.data;
  if ((await loadBillingMode()) === 'interest') throw new HttpsError('failed-precondition', 'payments_not_live');
  const creds = await cashfreeCreds();
  if (!creds) throw new HttpsError('failed-precondition', 'payments_not_configured');

  const profile = (await db().doc(`users/${uid}`).get()).data() ?? {};
  const pricing = await loadPricing();
  const market = marketFor(pricing, String(profile.country ?? 'IN'), String(profile.currency ?? 'INR'));
  const q = market ? quote(pricing, market, plan, period, Date.now()) : null;
  if (!q || q.currency !== 'INR') throw new HttpsError('failed-precondition', 'cashfree_inr_only');

  const orderId = makeOrderId(uid, plan, period, Date.now());
  const order = await createOrder(creds, {
    orderId,
    uid,
    amount: q.total,
    currency: q.currency,
    plan,
    period,
    email: req.auth?.token.email ?? null,
    phone: (req.auth?.token.phone_number as string | undefined)?.replace(/^\+91/, '') ?? null,
    returnUrl: safeReturnUrl(parsed.data.returnUrl),
  }).catch(() => {
    throw new HttpsError('unavailable', 'cashfree_unavailable');
  });
  await db()
    .doc(`billingOrders/${orderId}`)
    .set({ id: orderId, uid, plan, period, amount: q.total, currency: q.currency, provider: 'cashfree', status: 'created', createdAt: FieldValue.serverTimestamp() });
  return { orderId, amount: q.total, currency: q.currency, paymentSessionId: order.payment_session_id ?? null, environment: creds.base.includes('sandbox') ? 'sandbox' : 'production' };
});

const VerifyCashfreeInput = z.object({ orderId: z.string().min(3).max(64) });

/**
 * Confirms a Cashfree order after checkout. The plan is granted only when Cashfree reports the order PAID for this
 * user at the server price recorded when the order was created. Safe to call twice (idempotent per order).
 */
export const verifyCashfreePayment = onCall(callableOptions(), async (req) => {
  const uid = await requireAuth(req);
  const parsed = VerifyCashfreeInput.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'bad_request');
  const ref = db().doc(`billingOrders/${parsed.data.orderId}`);
  const pending = (await ref.get()).data();
  if (!pending || pending.uid !== uid) throw new HttpsError('not-found', 'order_not_found');
  if (pending.status === 'paid') return { verified: true };
  const creds = await cashfreeCreds();
  if (!creds) throw new HttpsError('failed-precondition', 'payments_not_configured');
  const order = await fetchOrder(creds, parsed.data.orderId).catch(() => {
    throw new HttpsError('unavailable', 'cashfree_unavailable');
  });
  if (!order || !orderPaidFor(order, { uid, amount: Number(pending.amount), currency: String(pending.currency) })) {
    return { verified: false, status: order?.order_status ?? 'UNKNOWN' };
  }
  const at = Date.now();
  const ent = await applyBillingEvent(uid, { type: 'purchased', plan: pending.plan, period: pending.period, at, periodEndsAt: addPeriod(at, pending.period), source: 'cashfree' }, `cf_order_${parsed.data.orderId}`);
  await ref.set({ status: 'paid', paidAt: FieldValue.serverTimestamp() }, { merge: true });
  await db()
    .doc(`payments/cf_${parsed.data.orderId}`)
    .set(
      { id: `cf_${parsed.data.orderId}`, uid, provider: 'cashfree', plan: pending.plan, period: pending.period, amount: pending.amount, currency: pending.currency, status: 'paid', verified: true, sandbox: creds.base.includes('sandbox'), createdAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  return { verified: true, status: ent?.status ?? 'active' };
});
