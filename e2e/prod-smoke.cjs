/**
 * Production smoke test (fit-me1). Creates two temporary accounts with the Admin SDK (a member and a temporary
 * "admin" staff member), checks the live site end to end, then deletes both accounts and their data.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=<key> node e2e/prod-smoke.cjs
 */
const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { onboard, signIn } = require('./helpers.cjs');
const req = require('module').createRequire(path.join(__dirname, '..', 'functions', 'package.json'));
const { initializeApp } = req('firebase-admin/app');
const { getAuth } = req('firebase-admin/auth');
const { getFirestore } = req('firebase-admin/firestore');
initializeApp({ projectId: 'fit-me1' });
const BASE = 'https://fit-me1.web.app';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots', 'prod-v4');
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const ok = (m) => {
  results.push(`PASS ${m}`);
  console.log('PASS', m);
};

(async () => {
  const stamp = Date.now();
  const memberEmail = `fitme-live-smoke-${stamp}@example.com`;
  const staffEmail = `fitme-live-staff-${stamp}@example.com`;
  const pw = 'a-long-test-password';
  const member = await getAuth().createUser({ email: memberEmail, password: pw, emailVerified: false, displayName: 'Ravi' });
  const staff = await getAuth().createUser({ email: staffEmail, password: pw });
  const browser = await chromium.launch();
  const errors = [];
  try {
    // 1. Site loads, sign-in options shown.
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(BASE, { waitUntil: 'domcontentloaded' });
    assert.equal(await p.title(), 'FitMe – For a Healthier Life.');
    await p.getByRole('button', { name: 'Continue with Google' }).waitFor({ timeout: 20000 });
    ok('site loads; Google sign-in button shown');
    // 2. Sign in (email) and onboard.
    await p.getByRole('button', { name: 'Continue with email' }).click();
    await p.getByLabel('Email').fill(memberEmail);
    await p.getByLabel('Password').fill(pw);
    await p.getByRole('button', { name: 'Sign in', exact: true }).click();
    await p.getByText('Choose your language').waitFor({ timeout: 30000 });
    await onboard(p);
    await p.locator('#card-calories').waitFor({ timeout: 30000 });
    await p.locator('#free-launch-card').waitFor({ timeout: 20000 });
    ok('member signs in and onboards; Home shows the Free Launch card');
    await p.screenshot({ path: path.join(OUT, 'home.png') });
    // 3. Food search on the live server index.
    await p.goto(`${BASE}/food?add=auto&q=dosa`, { waitUntil: 'domcontentloaded' });
    const input = p.getByPlaceholder('Search foods, for example dosa or oatmeal');
    await input.waitFor({ timeout: 15000 });
    await p.getByText(/Plain dosa|Rava dosa|Masala dosa/).first().waitFor({ timeout: 20000 });
    await input.fill('idly');
    await p.getByText(/^Idli/).first().waitFor({ timeout: 20000 });
    ok('food search: dosa and idly (alias) return real foods from the live index');
    await p.screenshot({ path: path.join(OUT, 'food-search.png') });
    await p.keyboard.press('Escape');
    // 4. Steps screen and prices (India).
    await p.goto(`${BASE}/health/steps`, { waitUntil: 'domcontentloaded' });
    await p.getByRole('heading', { name: 'Health' }).first().waitFor({ timeout: 20000 });
    ok('steps screen loads');
    await p.goto(`${BASE}/plans`, { waitUntil: 'domcontentloaded' });
    await p.getByText('₹199').first().waitFor({ timeout: 20000 });
    await p.getByText('₹399').first().waitFor({ timeout: 20000 });
    ok('plans show India prices in rupees (₹199 Premium, ₹399 Pro)');
    await p.screenshot({ path: path.join(OUT, 'plans.png') });
    // 5. Member cannot open admin.
    await p.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
    await p.locator('#admin-denied').waitFor({ timeout: 20000 });
    ok('a normal user is refused at /admin');
    await ctx.close();

    // 7. Staff (temporary admin role): dashboard opens; content editor role would not see finance (tested in e2e).
    await getAuth().setCustomUserClaims(staff.uid, { role: 'admin' });
    const s = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const sp = await s.newPage();
    sp.on('pageerror', (e) => errors.push(e.message));
    await sp.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded' });
    await sp.getByLabel('Email').fill(staffEmail);
    await sp.getByLabel('Password').fill(pw);
    await sp.getByRole('button', { name: 'Sign in' }).last().click();
    await sp.locator('#admin-app').waitFor({ timeout: 30000 });
    await sp.locator('#admin-analytics').waitFor({ timeout: 30000 });
    await sp.goto(`${BASE}/admin/plans`, { waitUntil: 'domcontentloaded' });
    await sp.getByText('Free Launch Mode').first().waitFor({ timeout: 20000 });
    await sp.locator('#free-launch').getByText('On', { exact: true }).waitFor({ timeout: 20000 });
    ok('admin dashboard works for staff; Plans shows Free Launch Mode: On');
    await sp.screenshot({ path: path.join(OUT, 'admin-plans.png'), fullPage: true });
    await s.close();
    const owner = (await getFirestore().collection('staff').where('role', '==', 'superAdmin').get()).docs.map((d) => d.id);
    assert(owner.length >= 1);
    const claims = (await getAuth().getUser(owner[0])).customClaims;
    assert.equal(claims.role, 'superAdmin');
    ok('owner account still holds the super admin role');
  } finally {
    await browser.close();
    const db = getFirestore();
    for (const u of [member, staff]) {
      await db.recursiveDelete(db.doc(`users/${u.uid}`));
      for (const c of ['access', 'entitlements', 'planInterest', 'grants', 'userStatus', 'billing', 'staff']) await db.recursiveDelete(db.doc(`${c}/${u.uid}`)).catch(() => undefined);
      await getAuth().deleteUser(u.uid).catch(() => undefined);
    }
    console.log('temporary accounts removed');
  }
  if (errors.length) console.log('PAGE ERRORS:', errors.slice(0, 5));
  console.log(results.join('\n'));
})().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
