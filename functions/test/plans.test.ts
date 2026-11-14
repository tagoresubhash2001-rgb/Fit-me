import { describe, expect, it } from 'vitest';
import { effectivePlan, planAllows, FEATURE_PLAN } from '../src/lib/plans';

const now = Date.UTC(2026, 10, 14);
describe('effectivePlan', () => {
  it('treats missing or malformed docs as free', () => {
    expect(effectivePlan(null, now)).toBe('free');
    expect(effectivePlan({ plan: 'gold' }, now)).toBe('free');
  });
  it('honours unexpired plans and downgrades expired ones', () => {
    expect(effectivePlan({ plan: 'pro', expiresAt: now + 1000 }, now)).toBe('pro');
    expect(effectivePlan({ plan: 'pro', expiresAt: now - 1 }, now)).toBe('free');
    expect(effectivePlan({ plan: 'premium', expiresAt: { toMillis: () => now + 5 } }, now)).toBe('premium');
    expect(effectivePlan({ plan: 'premium', expiresAt: null }, now)).toBe('premium');
  });
});
describe('planAllows', () => {
  it('orders free < premium < pro', () => {
    expect(planAllows('free', 'premium')).toBe(false);
    expect(planAllows('premium', 'premium')).toBe(true);
    expect(planAllows('premium', 'pro')).toBe(false);
    expect(planAllows('pro', 'premium')).toBe(true);
  });
  it('maps features to the PRD tiers', () => {
    expect(FEATURE_PLAN.foodPhotoScan).toBe('premium');
    expect(FEATURE_PLAN.micronutrients).toBe('premium');
    expect(FEATURE_PLAN.coachChat).toBe('pro');
    expect(FEATURE_PLAN.planner).toBe('pro');
  });
});
