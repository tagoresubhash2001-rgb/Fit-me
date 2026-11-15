import { HttpsError, type CallableOptions, type CallableRequest } from 'firebase-functions/v2/https';
import { isEmulator } from './admin';

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

export function requireAuth(req: CallableRequest<unknown>): string {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'sign_in_required');
  return uid;
}
