// Marks test accounts as billing testers (custom claim billingTester) so startTrial grants sandbox trials
// in "test" mode. Only accounts created by the test scripts. Usage: GOOGLE_APPLICATION_CREDENTIALS=... node e2e/_set-tester.cjs <email>
const req = require('module').createRequire(require('path').join(__dirname, '..', 'functions', 'package.json'));
const { initializeApp } = req('firebase-admin/app');
const { getAuth } = req('firebase-admin/auth');
initializeApp({ projectId: process.env.FIREBASE_PROJECT || 'fit-me1' });
(async () => {
  for (const email of process.argv.slice(2)) {
    if (!/^(fitme-|review|dbg)/.test(email)) throw new Error(`not a test account: ${email}`);
    const u = await getAuth().getUserByEmail(email);
    await getAuth().setCustomUserClaims(u.uid, { ...(u.customClaims ?? {}), billingTester: true });
    console.log('billing tester:', email);
  }
})();
