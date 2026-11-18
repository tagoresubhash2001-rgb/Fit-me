import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRICING,
  PricingConfig,
  applyEvent,
  hasAccess,
  marketFor,
  productId,
  quote,
  reminderDue,
  roundToStep,
  trialEligible,
  type Entitlement,
} from '../billing';

const NOW = Date.parse('2026-11-18T10:00:00Z');
const DAY = 86400000;
const withOffer = (end: string | null): PricingConfig => ({
  ...DEFAULT_PRICING,
  markets: { ...DEFAULT_PRICING.markets, IN: { ...DEFAULT_PRICING.markets.IN, offerEndsAt: end } },
});

describe('pricing config', () => {
  it('the seed is valid against the schema', () => {
    expect(PricingConfig.safeParse(DEFAULT_PRICING).success).toBe(true);
  });
  it('maps countries and currencies to markets', () => {
    expect(marketFor(DEFAULT_PRICING, 'IN')).toBe('IN');
    expect(marketFor(DEFAULT_PRICING, 'de')).toBe('EU');
    expect(marketFor(DEFAULT_PRICING, 'GB')).toBe('GB');
    expect(marketFor(DEFAULT_PRICING, 'JP', 'USD')).toBe('US');
    expect(marketFor(DEFAULT_PRICING, 'JP', 'JPY')).toBeNull();
  });
  it('uses the same product ids everywhere', () => {
    expect(productId('premium', 'quarterly')).toBe('premium_quarterly');
    expect(productId('pro', 'yearly')).toBe('pro_yearly');
  });
});

describe('India totals (PRD section 2)', () => {
  const t = (plan: 'premium' | 'pro', period: 'monthly' | 'quarterly' | 'yearly') => quote(DEFAULT_PRICING, 'IN', plan, period, NOW)!.total;
  it('Premium ₹199 / ₹478 / ₹1,433', () => {
    expect([t('premium', 'monthly'), t('premium', 'quarterly'), t('premium', 'yearly')]).toEqual([199, 478, 1433]);
  });
  it('Pro ₹399 / ₹958 / ₹2,873', () => {
    expect([t('pro', 'monthly'), t('pro', 'quarterly'), t('pro', 'yearly')]).toEqual([399, 958, 2873]);
  });
  it('per-month equivalent rounds down ("about ₹119 a month")', () => {
    expect(quote(DEFAULT_PRICING, 'IN', 'premium', 'yearly', NOW)!.perMonth).toBe(119);
    expect(quote(DEFAULT_PRICING, 'IN', 'pro', 'quarterly', NOW)!.perMonth).toBe(319);
  });
  it('round-down mode never shows less saving than advertised', () => {
    const down = { ...DEFAULT_PRICING, rounding: 'down' as const };
    for (const plan of ['premium', 'pro'] as const)
      for (const period of ['quarterly', 'yearly'] as const) {
        const q = quote(down, 'IN', plan, period, NOW)!;
        expect(q.savingPct).toBeGreaterThanOrEqual(q.discount);
      }
    expect(quote(down, 'IN', 'premium', 'quarterly', NOW)!.total).toBe(477);
  });
  it('every market and period gets a 30-day trial', () => {
    expect(quote(DEFAULT_PRICING, 'US', 'pro', 'yearly', NOW)!.trialDays).toBe(30);
  });
});

describe('rounding to store price steps', () => {
  it('rounds whole units and cents without float drift', () => {
    expect(roundToStep(477.6, 1, 'down')).toBe(477);
    expect(roundToStep(477.6, 1, 'nearest')).toBe(478);
    expect(roundToStep(1432.8, 1, 'nearest')).toBe(1433);
    expect(roundToStep(21.6, 0.01, 'down')).toBe(21.6);
    expect(roundToStep(64.8, 0.01, 'nearest')).toBe(64.8);
    expect(roundToStep(0.1 + 0.2, 0.01, 'down')).toBe(0.3);
  });
  it('other markets: same discounts in their currency', () => {
    expect(quote(DEFAULT_PRICING, 'US', 'premium', 'quarterly', NOW)!.total).toBe(21.6);
    expect(quote(DEFAULT_PRICING, 'GB', 'pro', 'yearly', NOW)!.total).toBe(208.8);
    expect(quote(DEFAULT_PRICING, 'EU', 'premium', 'yearly', NOW)!.currency).toBe('EUR');
  });
});

describe('pricing honesty', () => {
  it('no strike-through without an offer end date', () => {
    expect(quote(DEFAULT_PRICING, 'IN', 'premium', 'monthly', NOW)!.regularMonthly).toBeNull();
  });
  it('strike-through with a regular price and a future end date', () => {
    const q = quote(withOffer('2027-01-31T23:59:59+05:30'), 'IN', 'premium', 'monthly', NOW)!;
    expect(q.regularMonthly).toBe(299);
    expect(q.offerEndsAt).toBe('2027-01-31T23:59:59+05:30');
  });
  it('the strike-through disappears after the end date', () => {
    const q = quote(withOffer('2026-11-01T00:00:00Z'), 'IN', 'pro', 'yearly', NOW)!;
    expect(q.regularMonthly).toBeNull();
    expect(q.offerEndsAt).toBeNull();
  });
  it('markets without a regular price never show a reduction', () => {
    const cfg = { ...DEFAULT_PRICING, markets: { ...DEFAULT_PRICING.markets, US: { ...DEFAULT_PRICING.markets.US, offerEndsAt: '2027-01-31T00:00:00Z' } } };
    expect(quote(cfg, 'US', 'pro', 'monthly', NOW)!.regularMonthly).toBeNull();
  });
  it('EU shows the lowest price of the last 30 days next to a reduction', () => {
    const eu = DEFAULT_PRICING.markets.EU;
    const cfg = {
      ...DEFAULT_PRICING,
      markets: { ...DEFAULT_PRICING.markets, EU: { ...eu, offerEndsAt: '2027-01-31T00:00:00Z', plans: { premium: { regular: 12, offer: 9, lowest30d: 11 }, pro: eu.plans.pro } } },
    };
    expect(quote(cfg, 'EU', 'premium', 'monthly', NOW)!.lowest30d).toBe(11);
    expect(quote(cfg, 'EU', 'pro', 'monthly', NOW)!.lowest30d).toBeNull();
    expect(quote(withOffer('2027-01-31T00:00:00Z'), 'IN', 'premium', 'monthly', NOW)!.lowest30d).toBeNull();
  });
});

describe('entitlement state machine', () => {
  const trial = applyEvent(null, { type: 'trial_started', plan: 'pro', period: 'yearly', at: NOW, trialDays: 30, source: 'test' })!;
  it('starts a 30-day trial with access', () => {
    expect(trial.status).toBe('trialing');
    expect(trial.expiresAt).toBe(NOW + 30 * DAY);
    expect(hasAccess(trial, NOW + 29 * DAY)).toBe(true);
    expect(hasAccess(trial, NOW + 31 * DAY)).toBe(false);
  });
  it('cancelling a trial keeps access until the trial ends', () => {
    const c = applyEvent(trial, { type: 'cancelled', at: NOW + DAY })!;
    expect(c.status).toBe('cancelled');
    expect(c.willRenew).toBe(false);
    expect(hasAccess(c, NOW + 10 * DAY)).toBe(true);
    expect(hasAccess(c, NOW + 30 * DAY + 1)).toBe(false);
    expect(applyEvent(c, { type: 'uncancelled', at: NOW + 2 * DAY })!.status).toBe('trialing');
  });
  it('first charge, renewal, grace, expiry and refund', () => {
    const paid = applyEvent(trial, { type: 'purchased', plan: 'pro', period: 'yearly', at: NOW + 30 * DAY, periodEndsAt: NOW + 395 * DAY, source: 'test' })!;
    expect(paid.status).toBe('active');
    const grace = applyEvent(paid, { type: 'billing_issue', at: NOW + 395 * DAY, graceEndsAt: NOW + 411 * DAY })!;
    expect(grace.status).toBe('grace');
    expect(hasAccess(grace, NOW + 400 * DAY)).toBe(true);
    expect(applyEvent(grace, { type: 'renewed', at: NOW + 401 * DAY, periodEndsAt: NOW + 760 * DAY })!.status).toBe('active');
    const ended = applyEvent(grace, { type: 'expired', at: NOW + 411 * DAY })!;
    expect(hasAccess(ended, NOW + 411 * DAY)).toBe(false);
    const refunded = applyEvent(paid, { type: 'refunded', at: NOW + 40 * DAY })!;
    expect(hasAccess(refunded, NOW + 40 * DAY + 1)).toBe(false);
  });
  it('plan changes keep the period end unless the store sends a new one', () => {
    const down = applyEvent(trial, { type: 'plan_changed', plan: 'premium', period: 'monthly', at: NOW + DAY })!;
    expect(down.plan).toBe('premium');
    expect(down.expiresAt).toBe(trial.expiresAt);
  });
  it('admin grants without an end date keep access', () => {
    const admin: Entitlement = { plan: 'pro', status: 'active', source: 'admin', expiresAt: null };
    expect(hasAccess(admin, NOW + 1000 * DAY)).toBe(true);
  });
});

describe('trial eligibility and reminders', () => {
  it('trial once per account, and only if the store agrees', () => {
    expect(trialEligible(null)).toBe(true);
    expect(trialEligible(NOW - DAY)).toBe(false);
    expect(trialEligible(null, false)).toBe(false);
    expect(trialEligible(null, true)).toBe(true);
  });
  it('reminder goes out once within the last three days of the trial', () => {
    const ent = { status: 'trialing' as const, trialEndsAt: NOW + 3 * DAY };
    expect(reminderDue(ent, NOW - 1, false)).toBe(false);
    expect(reminderDue(ent, NOW + 1, false)).toBe(true);
    expect(reminderDue(ent, NOW + 1, true)).toBe(false);
    expect(reminderDue({ ...ent, status: 'cancelled' }, NOW + 1, false)).toBe(false);
  });
});
