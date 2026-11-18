/**
 * Pricing, free trial and entitlement rules (PRD section 2). Pure functions, shared by the app and Cloud
 * Functions: functions/src/billing/billing.ts is an exact copy (a test fails if the two differ).
 * Prices live in Firestore appConfig/pricing (server-write only); DEFAULT_PRICING is the seed and the
 * offline fallback, never a second source of truth in components.
 */
import { z } from 'zod';

export const PAID_PLANS = ['premium', 'pro'] as const;
export type PaidPlan = (typeof PAID_PLANS)[number];
export const PERIODS = ['monthly', 'quarterly', 'yearly'] as const;
export type Period = (typeof PERIODS)[number];

const PlanPrice = z.object({
  /** Regular monthly price. Shown struck through only with an offer end date (honesty rule). */
  regular: z.number().positive().nullable(),
  /** Monthly price people pay now (the launch offer, or the normal price when there is no offer). */
  offer: z.number().positive(),
  /** EU only: lowest price in the 30 days before a reduction was shown (Omnibus rule). */
  lowest30d: z.number().positive().nullable().optional(),
});

const Market = z.object({
  currency: z.string().length(3),
  countries: z.array(z.string().length(2)),
  /** EU consumer rules apply (show the lowest price of the last 30 days next to a reduction). */
  eu: z.boolean(),
  /** Smallest price step the app stores allow in this currency (1 = whole units, 0.01 = cents). */
  priceStep: z.number().positive(),
  /** ISO date-time the launch offer ends. Without it no regular price is struck through. */
  offerEndsAt: z.string().datetime({ offset: true }).nullable(),
  plans: z.object({ premium: PlanPrice, pro: PlanPrice }),
});

export const PricingConfig = z.object({
  version: z.number().int().positive(),
  trialDays: z.number().int().min(0).max(90),
  /** How period totals snap to store price steps: `down` never shrinks the saving, `nearest` rounds half up. */
  rounding: z.enum(['down', 'nearest']),
  periods: z.object({
    monthly: z.object({ months: z.literal(1), discount: z.literal(0) }),
    quarterly: z.object({ months: z.literal(3), discount: z.number().min(0).max(0.9) }),
    yearly: z.object({ months: z.literal(12), discount: z.number().min(0).max(0.9) }),
  }),
  markets: z.record(z.string(), Market),
});
export type PricingConfig = z.infer<typeof PricingConfig>;
export type MarketConfig = z.infer<typeof Market>;

const EURO_COUNTRIES = ['AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES'];

/**
 * Seed for appConfig/pricing (PRD section 2). India: Premium ₹299 regular, ₹199 offer; Pro ₹599 regular,
 * ₹399 offer. The launch-offer end date is set by the owner in Firestore; until then no price is struck
 * through. Other markets have no regular price configured, so they never show a reduction.
 */
export const DEFAULT_PRICING: PricingConfig = {
  version: 1,
  trialDays: 30,
  rounding: 'nearest',
  periods: {
    monthly: { months: 1, discount: 0 },
    quarterly: { months: 3, discount: 0.2 },
    yearly: { months: 12, discount: 0.4 },
  },
  markets: {
    IN: { currency: 'INR', countries: ['IN'], eu: false, priceStep: 1, offerEndsAt: null, plans: { premium: { regular: 299, offer: 199 }, pro: { regular: 599, offer: 399 } } },
    US: { currency: 'USD', countries: ['US'], eu: false, priceStep: 0.01, offerEndsAt: null, plans: { premium: { regular: null, offer: 9 }, pro: { regular: null, offer: 29 } } },
    GB: { currency: 'GBP', countries: ['GB'], eu: false, priceStep: 0.01, offerEndsAt: null, plans: { premium: { regular: null, offer: 9 }, pro: { regular: null, offer: 29 } } },
    EU: { currency: 'EUR', countries: EURO_COUNTRIES, eu: true, priceStep: 0.01, offerEndsAt: null, plans: { premium: { regular: null, offer: 9, lowest30d: null }, pro: { regular: null, offer: 29, lowest30d: null } } },
  },
};

/** Market for a country, falling back to the currency; null = store local price tiers only. */
export function marketFor(config: PricingConfig, country: string, currency?: string): string | null {
  const c = country.toUpperCase();
  for (const [key, m] of Object.entries(config.markets)) if (m.countries.includes(c)) return key;
  if (currency) for (const [key, m] of Object.entries(config.markets)) if (m.currency === currency.toUpperCase()) return key;
  return null;
}

/** Snap an amount to the store price step. Works in integer steps to avoid floating point drift. */
export function roundToStep(amount: number, step: number, mode: 'down' | 'nearest'): number {
  const units = amount / step;
  const n = mode === 'down' ? Math.floor(units + 1e-9) : Math.floor(units + 0.5 + 1e-9);
  const decimals = step >= 1 ? 0 : Math.round(-Math.log10(step));
  return Number((n * step).toFixed(decimals));
}

export interface Quote {
  plan: PaidPlan;
  period: Period;
  currency: string;
  months: number;
  /** What is charged per period after the trial. */
  total: number;
  /** Total divided by months, rounded down to the price step ("about ₹119 a month"). */
  perMonth: number;
  /** Advertised period discount (0.2 = "save 20%"). */
  discount: number;
  /** Saving against paying monthly for the same months, using the final rounded total. */
  savingPct: number;
  /** Regular monthly price to strike through, only when the honesty rules allow it. */
  regularMonthly: number | null;
  offerEndsAt: string | null;
  /** EU: lowest price in the last 30 days, shown next to a reduction. */
  lowest30d: number | null;
  trialDays: number;
}

/**
 * Price for a plan and billing period in a market. Period discounts apply to the monthly offer price.
 * A regular price is struck through only when it is configured, higher than the offer, and the offer has
 * a future end date; after the end date it disappears automatically.
 */
export function quote(config: PricingConfig, marketKey: string, plan: PaidPlan, period: Period, nowMs: number): Quote | null {
  const m = config.markets[marketKey];
  if (!m) return null;
  const p = m.plans[plan];
  const { months, discount } = config.periods[period];
  const total = roundToStep(p.offer * months * (1 - discount), m.priceStep, config.rounding);
  const perMonth = roundToStep(total / months, m.priceStep, 'down');
  const fullPrice = p.offer * months;
  const endMs = m.offerEndsAt ? Date.parse(m.offerEndsAt) : NaN;
  const offerLive = Number.isFinite(endMs) && endMs > nowMs;
  const showRegular = offerLive && p.regular !== null && p.regular > p.offer;
  return {
    plan,
    period,
    currency: m.currency,
    months,
    total,
    perMonth,
    discount,
    savingPct: fullPrice > 0 ? (fullPrice - total) / fullPrice : 0,
    regularMonthly: showRegular ? p.regular : null,
    offerEndsAt: offerLive ? m.offerEndsAt : null,
    lowest30d: showRegular && m.eu ? (p.lowest30d ?? p.regular) : null,
    trialDays: config.trialDays,
  };
}

/** Store product id for a plan and period, the same on the App Store, Google Play and Cashfree. */
export const productId = (plan: PaidPlan, period: Period) => `${plan}_${period}`;

// ---------------------------------------------------------------- Entitlements

export const ENTITLEMENT_STATUSES = ['trialing', 'active', 'grace', 'cancelled', 'expired'] as const;
export type EntitlementStatus = (typeof ENTITLEMENT_STATUSES)[number];

/** entitlements/{uid}: written only by Cloud Functions; clients read it. Times in epoch milliseconds. */
export interface Entitlement {
  plan: PaidPlan;
  status: EntitlementStatus;
  period?: Period;
  source: 'appstore' | 'playstore' | 'cashfree' | 'test' | 'admin';
  /** Access ends at this time unless renewed (trial end, period end or grace end). Null = no end (admin grant). */
  expiresAt: number | null;
  trialEndsAt?: number | null;
  willRenew?: boolean;
}

export type BillingEvent =
  | { type: 'trial_started'; plan: PaidPlan; period: Period; at: number; trialDays: number; source: Entitlement['source'] }
  | { type: 'purchased'; plan: PaidPlan; period: Period; at: number; periodEndsAt: number; source: Entitlement['source'] }
  | { type: 'renewed'; at: number; periodEndsAt: number }
  | { type: 'billing_issue'; at: number; graceEndsAt: number }
  | { type: 'cancelled'; at: number }
  | { type: 'uncancelled'; at: number }
  | { type: 'plan_changed'; plan: PaidPlan; period: Period; at: number; periodEndsAt?: number }
  | { type: 'expired'; at: number }
  | { type: 'refunded'; at: number };

const DAY = 24 * 3600 * 1000;

/**
 * Entitlement state machine. trialing -> active (first charge) | cancelled (keeps access to trial end) |
 * expired; active -> grace (payment failed) | cancelled (keeps access to period end) | expired;
 * grace -> active | expired; cancelled -> active (resubscribed) | expired. A refund ends access at once.
 */
export function applyEvent(current: Entitlement | null, e: BillingEvent): Entitlement | null {
  switch (e.type) {
    case 'trial_started': {
      const end = e.at + e.trialDays * DAY;
      return { plan: e.plan, period: e.period, status: 'trialing', source: e.source, expiresAt: end, trialEndsAt: end, willRenew: true };
    }
    case 'purchased':
      return { plan: e.plan, period: e.period, status: 'active', source: e.source, expiresAt: e.periodEndsAt, trialEndsAt: current?.trialEndsAt ?? null, willRenew: true };
    case 'renewed':
      return current ? { ...current, status: 'active', expiresAt: e.periodEndsAt, willRenew: true } : null;
    case 'billing_issue':
      return current && current.status !== 'expired' ? { ...current, status: 'grace', expiresAt: e.graceEndsAt } : current;
    case 'cancelled':
      // Access continues until the end of the trial or the paid period.
      return current && current.status !== 'expired' ? { ...current, status: 'cancelled', willRenew: false } : current;
    case 'uncancelled':
      return current && current.status === 'cancelled' ? { ...current, status: current.trialEndsAt && current.trialEndsAt > e.at ? 'trialing' : 'active', willRenew: true } : current;
    case 'plan_changed':
      return current ? { ...current, plan: e.plan, period: e.period, expiresAt: e.periodEndsAt ?? current.expiresAt } : null;
    case 'expired':
      return current ? { ...current, status: 'expired', willRenew: false, expiresAt: Math.min(current.expiresAt ?? e.at, e.at) } : null;
    case 'refunded':
      return current ? { ...current, status: 'expired', willRenew: false, expiresAt: e.at } : null;
  }
}

/** Whether the entitlement grants its plan right now. Cancelled keeps access until expiresAt. */
export function hasAccess(ent: Pick<Entitlement, 'status' | 'expiresAt'> | null | undefined, nowMs: number): boolean {
  if (!ent || ent.status === 'expired') return false;
  return ent.expiresAt === null || ent.expiresAt > nowMs;
}

/** Trial once per account, and only if the store also says the account is eligible (if it tells us). */
export function trialEligible(trialUsedAt: number | null | undefined, storeEligible: boolean | null = null): boolean {
  if (trialUsedAt) return false;
  return storeEligible !== false;
}

/** The trial-ending reminder goes out once, three days before the trial ends. */
export function reminderDue(ent: Pick<Entitlement, 'status' | 'trialEndsAt'> | null | undefined, nowMs: number, alreadySent: boolean): boolean {
  if (!ent || ent.status !== 'trialing' || !ent.trialEndsAt || alreadySent) return false;
  const left = ent.trialEndsAt - nowMs;
  return left > 0 && left <= 3 * DAY;
}
