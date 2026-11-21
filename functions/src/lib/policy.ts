import type { AccessPolicy } from './policySchema';
export type { AccessPolicy, FeatureOverride } from './policySchema';

/**
 * Access policy rules (no zod here, so the app's startup bundle stays small; the schema is in policySchema.ts).
 * Access policy set from the admin dashboard (Firestore appConfig/policy, server-write only). Shared by the app
 * and Cloud Functions: functions/src/lib/policy.ts is an exact copy (test: config-mirror). Functions enforce it;
 * the app uses the same rules only to decide what to show.
 *
 *  - Free Launch Mode: every feature free for everyone, or only in the listed countries. Plans, prices and
 *    subscriptions are untouched; switching it off brings the normal stages and paid plans back at once.
 *  - Feature overrides: move a single feature to another tier (free / premium / pro), globally or per country.
 *  - Stage days per country: Welcome Unlock and trial length for new sign-ups in that country.
 */
export type Tier = 'free' | 'premium' | 'pro';
const RANK: Record<Tier, number> = { free: 0, premium: 1, pro: 2 };

/** Every gated feature and its default tier (PRD section 2). */
export const FEATURE_TIERS = {
  micronutrients: 'premium',
  foodPhotoScan: 'premium',
  foodTextAnalysis: 'premium',
  barcodeScan: 'premium',
  coachChat: 'pro',
  planner: 'pro',
  aiPlanner: 'pro',
  mealPlanGenerator: 'pro',
  workoutGenerator: 'pro',
  reminders: 'pro',
  advancedReports: 'pro',
} as const satisfies Record<string, Tier>;
export type GatedFeature = keyof typeof FEATURE_TIERS;
export const GATED_FEATURES = Object.keys(FEATURE_TIERS) as GatedFeature[];

/** Policy before the admin document loads (or when it is missing): no Free Launch, default tiers. */
export const EMPTY_POLICY: AccessPolicy = { version: 1, freeLaunch: { enabled: false, countries: [] }, overrides: [], stageDays: {} };

const inList = (countries: string[], country: string | null | undefined) => countries.length === 0 || (!!country && countries.includes(country.toUpperCase()));

/** True when Free Launch Mode applies to this country. */
export function freeLaunchFor(policy: AccessPolicy, country: string | null | undefined): boolean {
  return policy.freeLaunch.enabled && inList(policy.freeLaunch.countries, country);
}

/** Tier a feature needs in a country. A country-specific override wins over a global one. */
export function tierFor(policy: AccessPolicy, feature: GatedFeature, country: string | null | undefined): Tier {
  let global: Tier | null = null;
  let local: Tier | null = null;
  for (const o of policy.overrides) {
    if (o.feature !== feature) continue;
    if (o.countries.length === 0) global = o.tier;
    else if (country && o.countries.includes(country.toUpperCase())) local = o.tier;
  }
  return local ?? global ?? FEATURE_TIERS[feature];
}

/** The decision used everywhere: can a user on `plan` in `country` use `feature`? */
export function canUse(policy: AccessPolicy, plan: Tier, feature: GatedFeature, country: string | null | undefined): boolean {
  if (freeLaunchFor(policy, country)) return true;
  return RANK[plan] >= RANK[tierFor(policy, feature, country)];
}

/** Plan to show and use: Free Launch Mode counts as the top tier. */
export function policyPlan(policy: AccessPolicy, plan: Tier, country: string | null | undefined): Tier {
  return freeLaunchFor(policy, country) ? 'pro' : plan;
}

/** A per-user grant from the admin dashboard (grants/{uid}): free access to a plan until a date. */
export interface Grant {
  plan: Tier;
  expiresAtMs: number | null;
}
export function grantPlan(g: Grant | null | undefined, nowMs: number): Tier {
  if (!g || g.plan === 'free') return 'free';
  return g.expiresAtMs === null || g.expiresAtMs > nowMs ? g.plan : 'free';
}
export function bestTier(...tiers: Tier[]): Tier {
  return tiers.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), 'free' as Tier);
}

/** Stage lengths for a new sign-up in a country. */
export function stageDaysFor(policy: AccessPolicy, country: string | null | undefined, fallback: { welcomeDays: number; trialDays: number }) {
  return (country && policy.stageDays[country.toUpperCase()]) || fallback;
}
