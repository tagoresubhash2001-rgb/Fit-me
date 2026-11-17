// Removes a test user and their data. Usage: node e2e/_cleanup-user.cjs <uid>
const req = require('module').createRequire(require('path').join(__dirname, '..', 'functions', 'package.json'));
const { initializeApp } = req('firebase-admin/app');
const { getFirestore } = req('firebase-admin/firestore');
const { getAuth } = req('firebase-admin/auth');
initializeApp({ projectId: 'fit-me1' });
const db = getFirestore();
const uid = process.argv[2];
(async () => {
  await db.recursiveDelete(db.doc(`users/${uid}`));
  await Promise.all(['storeWaitlist', 'entitlements', 'planInterest'].map((c) => db.doc(`${c}/${uid}`).delete()));
  await getAuth().deleteUser(uid).catch(() => {});
  console.log('removed test user', uid);
})();
