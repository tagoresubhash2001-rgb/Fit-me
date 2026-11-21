import { HttpsError } from 'firebase-functions/v2/https';
import { db } from './admin';
import { DEFAULT_FEATURES, FeatureFlags, type FeatureKey } from './appConfig';

let cache: { at: number; flags: Record<FeatureKey, boolean> } | null = null;

/** Admin feature switches (appConfig/features), cached for a minute. Missing or invalid means on. */
export async function featureEnabled(key: FeatureKey): Promise<boolean> {
  if (!cache || Date.now() - cache.at > 60_000) {
    const snap = await db().doc('appConfig/features').get().catch(() => null);
    const parsed = snap?.exists ? FeatureFlags.safeParse(snap.data()) : null;
    cache = { at: Date.now(), flags: (parsed?.success ? parsed.data : DEFAULT_FEATURES) as Record<FeatureKey, boolean> };
  }
  return cache.flags[key] !== false;
}

export async function requireEnabled(key: FeatureKey): Promise<void> {
  if (!(await featureEnabled(key))) throw new HttpsError('failed-precondition', 'feature_disabled', { feature: key });
}
