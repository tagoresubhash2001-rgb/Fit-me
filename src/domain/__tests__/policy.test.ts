import { describe, expect, it } from 'vitest';
import { canUse, EMPTY_POLICY, freeLaunchFor, grantPlan, policyPlan, stageDaysFor, tierFor, bestTier } from '../policy';
import { AccessPolicy, DEFAULT_POLICY } from '../policySchema';
import { canOpen, ROLE_SECTIONS } from '../adminRoles';

const p = (x: unknown) => AccessPolicy.parse(x);

describe('access policy', () => {
  it('the startup default equals the schema default', () => expect(EMPTY_POLICY).toEqual(DEFAULT_POLICY));
  it('defaults follow the PRD tiers', () => {
    expect(tierFor(DEFAULT_POLICY, 'coachChat', 'IN')).toBe('pro');
    expect(canUse(DEFAULT_POLICY, 'free', 'foodPhotoScan', 'IN')).toBe(false);
    expect(canUse(DEFAULT_POLICY, 'premium', 'foodPhotoScan', 'IN')).toBe(true);
  });
  it('Free Launch Mode unlocks everything globally or only in listed countries', () => {
    const global = p({ freeLaunch: { enabled: true } });
    expect(canUse(global, 'free', 'coachChat', 'US')).toBe(true);
    expect(policyPlan(global, 'free', null)).toBe('pro');
    const india = p({ freeLaunch: { enabled: true, countries: ['IN'] } });
    expect(freeLaunchFor(india, 'IN')).toBe(true);
    expect(freeLaunchFor(india, 'US')).toBe(false);
    expect(freeLaunchFor(india, null)).toBe(false);
    expect(canUse(p({ freeLaunch: { enabled: false } }), 'free', 'coachChat', 'IN')).toBe(false);
  });
  it('a country override wins over a global one', () => {
    const pol = p({ overrides: [ { feature: 'foodPhotoScan', tier: 'pro', countries: [] }, { feature: 'foodPhotoScan', tier: 'free', countries: ['IN'] } ] });
    expect(tierFor(pol, 'foodPhotoScan', 'IN')).toBe('free');
    expect(tierFor(pol, 'foodPhotoScan', 'US')).toBe('pro');
    expect(canUse(pol, 'free', 'foodPhotoScan', 'IN')).toBe(true);
    expect(canUse(pol, 'premium', 'foodPhotoScan', 'US')).toBe(false);
  });
  it('grants expire and the best tier wins', () => {
    expect(grantPlan({ plan: 'pro', expiresAtMs: 2000 }, 1000)).toBe('pro');
    expect(grantPlan({ plan: 'pro', expiresAtMs: 2000 }, 3000)).toBe('free');
    expect(grantPlan({ plan: 'premium', expiresAtMs: null }, 3000)).toBe('premium');
    expect(bestTier('free', 'premium', 'free')).toBe('premium');
  });
  it('stage days per country fall back to the global values', () => {
    const pol = p({ stageDays: { IN: { welcomeDays: 14, trialDays: 30 } } });
    expect(stageDaysFor(pol, 'IN', { welcomeDays: 7, trialDays: 30 }).welcomeDays).toBe(14);
    expect(stageDaysFor(pol, 'US', { welcomeDays: 7, trialDays: 30 }).welcomeDays).toBe(7);
  });
  it('rejects lowercase country codes and unknown features', () => {
    expect(AccessPolicy.safeParse({ freeLaunch: { enabled: true, countries: ['in'] } }).success).toBe(false);
    expect(AccessPolicy.safeParse({ overrides: [{ feature: 'nope', tier: 'free' }] }).success).toBe(false);
  });
});

describe('admin roles', () => {
  it('content editors cannot open finance; finance cannot open content; only super admins manage admins and keys', () => {
    expect(canOpen('content', 'finance')).toBe(false);
    expect(canOpen('finance', 'content')).toBe(false);
    expect(canOpen('finance', 'finance')).toBe(true);
    expect(canOpen('admin', 'admins')).toBe(false);
    expect(canOpen('admin', 'integrations')).toBe(false);
    expect(canOpen('superAdmin', 'integrations')).toBe(true);
    expect(canOpen(null, 'overview')).toBe(false);
    expect(ROLE_SECTIONS.moderator).toEqual(ROLE_SECTIONS.support);
  });
});
