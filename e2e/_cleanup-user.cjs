// Removes test users and their data from fit-me1. Accepts uids or emails (comma or space separated).
// Usage: GOOGLE_APPLICATION_CREDENTIALS=<admin key> node e2e/_cleanup-user.cjs <uid|email> [...]
const req = require('module').createRequire(require('path').join(__dirname, '..', 'functions', 'package.json'));
const { initializeApp } = req('firebase-admin/app');
const { getFirestore } = req('firebase-admin/firestore');
const { getAuth } = req('firebase-admin/auth');
initializeApp({ projectId: 'fit-me1' });
const db = getFirestore();
const ids = process.argv.slice(2).flatMap((a) => a.split(',')).filter(Boolean);
(async () => {
  for (const id of ids) {
    // Only ever remove accounts created by the test scripts.
    const user = id.includes('@') ? await getAuth().getUserByEmail(id).catch(() => null) : await getAuth().getUser(id).catch(() => null);
    const uid = user?.uid ?? (id.includes('@') ? null : id);
    if (!uid) {
      console.log('not found', id);
      continue;
    }
    if (user && !/^(fitme-|live-check-|review|dbg)/.test(user.email ?? '')) {
      console.log('skipped (not a test account)', user.email);
      continue;
    }
    await db.recursiveDelete(db.doc(`users/${uid}`));
    await Promise.all(['storeWaitlist', 'entitlements', 'planInterest'].map((c) => db.doc(`${c}/${uid}`).delete()));
    await getAuth().deleteUser(uid).catch(() => {});
    console.log('removed test user', uid, user?.email ?? '');
  }
})();
