import { db, isEmulator } from './admin';
import { AccessPolicy, DEFAULT_POLICY } from './policy';

let policyCache: { at: number; policy: AccessPolicy } | null = null;

/** Admin access policy (appConfig/policy), cached for 30 seconds. Missing or invalid = defaults. */
export async function loadPolicy(): Promise<AccessPolicy> {
  // 30-second cache in production; none in the emulator so tests see changes at once.
  if (!policyCache || isEmulator() || Date.now() - policyCache.at > 30_000) {
    const snap = await db().doc('appConfig/policy').get().catch(() => null);
    const parsed = snap?.exists ? AccessPolicy.safeParse(snap.data()) : null;
    policyCache = { at: Date.now(), policy: parsed?.success ? parsed.data : DEFAULT_POLICY };
  }
  return policyCache.policy;
}
export function clearPolicyCache() {
  policyCache = null;
}

/** The user's country from their profile (set at sign-up, editable in Settings); null when unknown. */
export async function userCountry(uid: string): Promise<string | null> {
  const c = (await db().doc(`users/${uid}`).get().catch(() => null))?.get('country');
  return typeof c === 'string' && /^[A-Za-z]{2}$/.test(c) ? c.toUpperCase() : null;
}

