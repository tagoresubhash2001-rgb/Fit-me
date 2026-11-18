/**
 * Store webhook payloads -> billing events (pure, unit tested). RevenueCat unifies the App Store and
 * Google Play; Cashfree covers web subscriptions. Both use the same product ids: <plan>_<period>.
 */
import { createHmac, timingSafeEqual } from 'crypto';
import { PAID_PLANS, PERIODS, type BillingEvent, type Entitlement, type PaidPlan, type Period } from './billing';

export function parseProductId(id: string | undefined | null): { plan: PaidPlan; period: Period } | null {
  if (!id) return null;
  // Store ids may carry a base plan suffix (Play: "pro_yearly:base") or a prefix ("com.sindulis.fitme.pro_yearly").
  const m = /(premium|pro)_(monthly|quarterly|yearly)/.exec(id);
  if (!m) return null;
  const plan = m[1] as PaidPlan;
  const period = m[2] as Period;
  return PAID_PLANS.includes(plan) && PERIODS.includes(period) ? { plan, period } : null;
}

// ---------------------------------------------------------------- RevenueCat

export interface RevenueCatEvent {
  id: string;
  type: string;
  app_user_id: string;
  product_id?: string;
  new_product_id?: string;
  period_type?: 'TRIAL' | 'INTRO' | 'NORMAL' | 'PROMOTIONAL';
  purchased_at_ms?: number;
  event_timestamp_ms?: number;
  expiration_at_ms?: number | null;
  grace_period_expiration_at_ms?: number | null;
  store?: string;
  environment?: 'SANDBOX' | 'PRODUCTION';
}

const rcSource = (store?: string): Entitlement['source'] => (store === 'PLAY_STORE' ? 'playstore' : 'appstore');

/** Constant-time check of the Authorization header configured in the RevenueCat dashboard. */
export function revenueCatAuthorized(header: string | undefined, secret: string): boolean {
  if (!header || !secret) return false;
  const a = Buffer.from(header.replace(/^Bearer\s+/i, ''));
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function fromRevenueCat(e: RevenueCatEvent): BillingEvent | null {
  const at = e.event_timestamp_ms ?? e.purchased_at_ms ?? Date.now();
  const product = parseProductId(e.new_product_id ?? e.product_id);
  const end = e.expiration_at_ms ?? null;
  switch (e.type) {
    case 'INITIAL_PURCHASE':
      if (!product || !end) return null;
      if (e.period_type === 'TRIAL') {
        const days = Math.max(1, Math.round((end - (e.purchased_at_ms ?? at)) / 86400000));
        return { type: 'trial_started', plan: product.plan, period: product.period, at: e.purchased_at_ms ?? at, trialDays: days, source: rcSource(e.store) };
      }
      return { type: 'purchased', plan: product.plan, period: product.period, at, periodEndsAt: end, source: rcSource(e.store) };
    case 'RENEWAL':
      // The first charge after a trial arrives as RENEWAL with a NORMAL period.
      if (!product || !end) return null;
      return { type: 'purchased', plan: product.plan, period: product.period, at, periodEndsAt: end, source: rcSource(e.store) };
    case 'PRODUCT_CHANGE':
      return product ? { type: 'plan_changed', plan: product.plan, period: product.period, at, periodEndsAt: end ?? undefined } : null;
    case 'CANCELLATION':
      return { type: 'cancelled', at };
    case 'UNCANCELLATION':
      return { type: 'uncancelled', at };
    case 'BILLING_ISSUE':
      return { type: 'billing_issue', at, graceEndsAt: e.grace_period_expiration_at_ms ?? end ?? at };
    case 'EXPIRATION':
      return { type: 'expired', at };
    default:
      return null; // TRANSFER, SUBSCRIBER_ALIAS, TEST, NON_RENEWING_PURCHASE: no entitlement change
  }
}

// ---------------------------------------------------------------- Cashfree (web)

/** Cashfree signs webhooks: base64(HMAC-SHA256(timestamp + raw body, client secret)). */
export function cashfreeSignatureValid(rawBody: string, timestamp: string | undefined, signature: string | undefined, secret: string): boolean {
  if (!timestamp || !signature || !secret) return false;
  const expected = createHmac('sha256', secret).update(timestamp + rawBody).digest('base64');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface CashfreeWebhook {
  type: string;
  event_time?: string;
  data?: {
    subscription_details?: {
      subscription_id?: string;
      subscription_status?: string;
      plan_details?: { plan_id?: string };
      subscription_tags?: Record<string, string>;
      next_schedule_date?: string;
      subscription_first_charge_time?: string;
    };
    payment?: { payment_id?: string };
  };
}

/** uid travels in subscription_tags.uid (set when the subscription is created). */
export function cashfreeUid(w: CashfreeWebhook): string | null {
  return w.data?.subscription_details?.subscription_tags?.uid ?? null;
}

export function fromCashfree(w: CashfreeWebhook, trialDays: number): BillingEvent | null {
  const sub = w.data?.subscription_details;
  const at = w.event_time ? Date.parse(w.event_time) : Date.now();
  const product = parseProductId(sub?.plan_details?.plan_id);
  const next = sub?.next_schedule_date ? Date.parse(sub.next_schedule_date) : NaN;
  const status = sub?.subscription_status?.toUpperCase();
  switch (w.type) {
    case 'SUBSCRIPTION_STATUS_CHANGED':
      if (status === 'ACTIVE' && product) {
        // Mandate authorised: the trial starts; the first charge is scheduled for the trial end.
        return { type: 'trial_started', plan: product.plan, period: product.period, at, trialDays, source: 'cashfree' };
      }
      if (status === 'CUSTOMER_CANCELLED' || status === 'CANCELLED') return { type: 'cancelled', at };
      if (status === 'ON_HOLD') return { type: 'billing_issue', at, graceEndsAt: at + 7 * 86400000 };
      if (status === 'EXPIRED' || status === 'COMPLETED') return { type: 'expired', at };
      return null;
    case 'SUBSCRIPTION_PAYMENT_SUCCESS':
      return product && Number.isFinite(next) ? { type: 'purchased', plan: product.plan, period: product.period, at, periodEndsAt: next, source: 'cashfree' } : null;
    case 'SUBSCRIPTION_PAYMENT_FAILED':
      return { type: 'billing_issue', at, graceEndsAt: at + 7 * 86400000 };
    default:
      return null;
  }
}
