import { HttpsError, type CallableOptions, type CallableRequest } from 'firebase-functions/v2/https';
import { isEmulator } from './admin';

/** Shared options for every callable: App Check is enforced outside the emulator. */
export const callableOptions = (extra: Partial<CallableOptions> = {}): CallableOptions => ({
  region: 'asia-south1',
  enforceAppCheck: !isEmulator(),
  consumeAppCheckToken: false,
  ...extra,
});

export function requireAuth(req: CallableRequest<unknown>): string {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'sign_in_required');
  return uid;
}
