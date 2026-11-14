import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { db, adminAuth, bucket } from '../lib/admin';
import { callableOptions, requireAuth } from '../lib/callable';

/**
 * In-app account deletion (App Store 5.1.1(v), Google Play, GDPR, DPDP).
 * Deletes every user document, uploaded file and the auth account. Irreversible.
 * The client asks the user to confirm (and re-authenticate) before calling.
 */
export const deleteAccount = onCall(callableOptions({ timeoutSeconds: 300 }), async (req) => {
  const uid = requireAuth(req);
  const firestore = db();
  await firestore.recursiveDelete(firestore.doc(`users/${uid}`));
  await Promise.all([
    firestore.doc(`entitlements/${uid}`).delete(),
    firestore.doc(`storeWaitlist/${uid}`).delete(),
  ]);
  const usage = await firestore.collection('usage').where('uid', '==', uid).get();
  await Promise.all(usage.docs.map((d) => d.ref.delete()));
  try {
    await bucket().deleteFiles({ prefix: `users/${uid}/` });
  } catch (e) {
    logger.warn('storage cleanup failed', { uid, error: (e as Error).message });
  }
  await adminAuth().deleteUser(uid);
  logger.info('account deleted', { uid });
  return { deleted: true };
});
