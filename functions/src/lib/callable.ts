import { HttpsError, type CallableOptions, type CallableRequest } from 'firebase-functions/v2/https';
import { db, isEmulator } from './admin';

/**
 * App Check enforcement for callables. Off until reCAPTCHA Enterprise (web) and App Attest / Play Integrity
 * (mobile) are registered for the project; see docs/DEPLOY.md "Not set up yet". Turn on by setting this to true.
 */
export const ENFORCE_APP_CHECK = false;

/** Cost safety: at most this many instances per function (PRD section 13, per-user rate limits still apply). */
export const MAX_INSTANCES = 5;

/** Shared options for every callable. */
export const callableOptions = (extra: Partial<CallableOptions> = {}): CallableOptions => ({
  region: 'asia-south1',
  maxInstances: MAX_INSTANCES,
  enforceAppCheck: ENFORCE_APP_CHECK && !isEmulator(),
  consumeAppCheckToken: false,
  ...extra,
});

const statusCache = new Map<string, { disabled: boolean; at: number }>();

/** True when an admin deactivated the account (userStatus/{uid}, server-written). Cached for 30 s. */
export async function isDeactivated(uid: string): Promise<boolean> {
  const hit = statusCache.get(uid);
  if (hit && Date.now() - hit.at < 30_000) return hit.disabled;
  const snap = await db().doc(`userStatus/${uid}`).get();
  const disabled = snap.exists && snap.get('disabled') === true;
  statusCache.set(uid, { disabled, at: Date.now() });
  return disabled;
}

/**
 * Signed-in, active user. Deactivated accounts are also disabled in Auth with refresh tokens revoked; this check
 * blocks their still-valid ID token (up to an hour) from calling any function in the meantime.
 */
export async function requireAuth(req: CallableRequest<unknown>): Promise<string> {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'sign_in_required');
  if (await isDeactivated(uid)) throw new HttpsError('permission-denied', 'account_disabled');
  return uid;
}
