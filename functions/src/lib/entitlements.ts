import { HttpsError } from 'firebase-functions/v2/https';
import { db, isEmulator } from './admin';
import { effectivePlan, type Feature, type Plan, type EntitlementDoc } from './plans';
import { combinedPlan, stageAt } from './access';
import { ensureAccess } from '../account/access';
import { bestTier, canUse, grantPlan, policyPlan, tierFor } from './policy';
import { loadPolicy, userCountry } from './policyStore';
export { loadPolicy, userCountry, clearPolicyCache } from './policyStore';

/** Subscription, free stage and admin grant combined (without Free Launch Mode). */
export async function basePlan(uid: string): Promise<Plan> {
  // Emulator-only escape hatch for local development of paid features. Never active in deployed functions.
  if (isEmulator() && process.env.DEV_GRANT_PLAN && ['premium', 'pro'].includes(process.env.DEV_GRANT_PLAN)) {
    return process.env.DEV_GRANT_PLAN as Plan;
  }
  const now = Date.now();
  const [snap, access, grant] = await Promise.all([
    db().doc(`entitlements/${uid}`).get(),
    ensureAccess(uid).catch(() => null), // a missing auth user (tests) means no free stage
    db().doc(`grants/${uid}`).get().catch(() => null),
  ]);
  const subscription = effectivePlan(snap.exists ? (snap.data() as EntitlementDoc) : null, now);
  const g = grant?.exists ? { plan: grant.get('plan') as Plan, expiresAtMs: (grant.get('expiresAtMs') as number | null) ?? null } : null;
  // Free stages (7-day Welcome Unlock, then the 30-day Free Trial) and admin grants add to any subscription.
  return bestTier(combinedPlan(subscription, stageAt(access, now).plan), grantPlan(g, now));
}

export async function getPlan(uid: string): Promise<Plan> {
  const [plan, policy, country] = await Promise.all([basePlan(uid), loadPolicy(), userCountry(uid)]);
  return policyPlan(policy, plan, country);
}

/** Server-side gate used by every Premium / Pro function: tiers, per-country overrides and Free Launch Mode. */
export async function requireFeature(uid: string, feature: Feature): Promise<Plan> {
  const [plan, policy, country] = await Promise.all([basePlan(uid), loadPolicy(), userCountry(uid)]);
  if (!canUse(policy, plan, feature, country)) {
    throw new HttpsError('permission-denied', 'upgrade_required', { feature, required: tierFor(policy, feature, country), plan });
  }
  return policyPlan(policy, plan, country);
}

/** Non-throwing check (used where a feature only adds detail, such as micronutrients in search). */
export async function featureAllowed(uid: string, feature: Feature): Promise<boolean> {
  const [plan, policy, country] = await Promise.all([basePlan(uid), loadPolicy(), userCountry(uid)]);
  return canUse(policy, plan, feature, country);
}
