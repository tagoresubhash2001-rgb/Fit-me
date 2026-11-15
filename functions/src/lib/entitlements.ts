import { HttpsError } from 'firebase-functions/v2/https';
import { db, isEmulator } from './admin';
import { effectivePlan, FEATURE_PLAN, planAllows, type Feature, type Plan, type EntitlementDoc } from './plans';

export async function getPlan(uid: string): Promise<Plan> {
  // Emulator-only escape hatch for local development of paid features. Never active in deployed functions.
  if (isEmulator() && process.env.DEV_GRANT_PLAN && ['premium', 'pro'].includes(process.env.DEV_GRANT_PLAN)) {
    return process.env.DEV_GRANT_PLAN as Plan;
  }
  const snap = await db().doc(`entitlements/${uid}`).get();
  return effectivePlan(snap.exists ? (snap.data() as EntitlementDoc) : null, Date.now());
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
