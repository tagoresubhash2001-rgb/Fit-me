import { HttpsError } from 'firebase-functions/v2/https';
import { db, isEmulator } from './admin';
import { effectivePlan, FEATURE_PLAN, planAllows, type Feature, type Plan, type EntitlementDoc } from './plans';
import { combinedPlan, stageAt } from './access';
import { ensureAccess } from '../account/access';

export async function getPlan(uid: string): Promise<Plan> {
  // Emulator-only escape hatch for local development of paid features. Never active in deployed functions.
  if (isEmulator() && process.env.DEV_GRANT_PLAN && ['premium', 'pro'].includes(process.env.DEV_GRANT_PLAN)) {
    return process.env.DEV_GRANT_PLAN as Plan;
  }
  const now = Date.now();
  const [snap, access] = await Promise.all([
    db().doc(`entitlements/${uid}`).get(),
    ensureAccess(uid).catch(() => null), // a missing auth user (tests) means no free stage
  ]);
  const subscription = effectivePlan(snap.exists ? (snap.data() as EntitlementDoc) : null, now);
  // Free stages (7-day Welcome Unlock, then the 30-day Free Trial) grant their plan on top of any subscription.
  return combinedPlan(subscription, stageAt(access, now).plan);
}

/** Server-side gate used by every Premium / Pro function. Throws permission-denied with a stable reason. */
export async function requireFeature(uid: string, feature: Feature): Promise<Plan> {
  const plan = await getPlan(uid);
  const required = FEATURE_PLAN[feature];
  if (!planAllows(plan, required)) {
    throw new HttpsError('permission-denied', 'upgrade_required', { feature, required, plan });
  }
  return plan;
}
