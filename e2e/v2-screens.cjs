/**
 * v2 screens against the Emulator Suite: Home steps tile, Settings (devices, permissions, photo, stories entry),
 * route tracker, stories, plans and the admin dashboard (staff claim set with the Admin SDK on the emulator),
 * at phone widths 360/375/390/412/430 plus tablet and desktop. Checks: no horizontal scroll, canvas background
 * on <html> (no white flash while fast-scrolling), no page errors. Screenshots in docs/screenshots/v2.
 * Prereqs: `firebase emulators:start --project demo-fitmeai` and `vite --mode emulators` on :5173.
 */
const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const { DEVICES, tap, signUp, onboard, signIn, assertNoHorizontalScroll, path } = require('./helpers.cjs');

const BASE = process.argv[2] || 'http://127.0.0.1:5173';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots', 'v2');
fs.mkdirSync(OUT, { recursive: true });
const WIDTHS = [360, 375, 390, 412, 430];

async function setStaff(email) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
  const req = require('module').createRequire(path.join(__dirname, '..', 'functions', 'package.json'));
  const { initializeApp, getApps } = req('firebase-admin/app');
  const { getAuth } = req('firebase-admin/auth');
  if (!getApps().length) initializeApp({ projectId: 'demo-fitmeai' });
  const u = await getAuth().getUserByEmail(email);
  await getAuth().setCustomUserClaims(u.uid, { role: 'superAdmin' });
}

async function fastScrollCheck(page, label) {
  const bg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  assert(bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)', `${label}: <html> has no canvas background (${bg})`);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 1600);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -1600);
}

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const email = `fitme-v2-${Date.now()}@example.test`;
  const results = [];

  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    await signUp(page, BASE, email);
    await onboard(page);
    await page.locator('#card-calories').waitFor({ timeout: 30000 });
    await ctx.close();
  }

  const sizes = [...WIDTHS.map((w) => [`w${w}`, { viewport: { width: w, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }]), ['ipad-portrait', DEVICES['ipad-portrait']], ['desktop', DEVICES.desktop]];
  for (const [name, dev] of sizes) {
    const ctx = await browser.newContext({ ...dev, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
    await signIn(page, BASE, email);
    await assertNoHorizontalScroll(page, `${name} home`);
    await fastScrollCheck(page, `${name} home`);
    await page.screenshot({ path: path.join(OUT, `${name}-home.png`) });

    await page.goto(`${BASE}/settings`, { waitUntil: 'domcontentloaded' });
    await page.locator('#permissions').waitFor({ timeout: 20000 });
    await page.locator('#devices').waitFor();
    await assertNoHorizontalScroll(page, `${name} settings`);
    await fastScrollCheck(page, `${name} settings`);
    await page.locator('#devices').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(OUT, `${name}-settings-devices.png`) });
    await page.locator('#permissions').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(OUT, `${name}-settings-permissions.png`) });

    await page.goto(`${BASE}/workouts`, { waitUntil: 'domcontentloaded' });
    await tap(page, page.locator('#open-route'));
    await page.locator('#route-tracker').waitFor();
    await page.waitForTimeout(800);
    await assertNoHorizontalScroll(page, `${name} route`);
    await page.screenshot({ path: path.join(OUT, `${name}-route.png`) });

    await page.goto(`${BASE}/stories`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Stories' }).first().waitFor({ timeout: 20000 });
    await assertNoHorizontalScroll(page, `${name} stories`);
    await page.screenshot({ path: path.join(OUT, `${name}-stories.png`) });

    await page.goto(`${BASE}/plans`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await assertNoHorizontalScroll(page, `${name} plans`);
    await page.screenshot({ path: path.join(OUT, `${name}-plans.png`) });
    results.push(`${name}: ok`);
    await ctx.close();
  }

  // Admin: a signed-in member without a staff role is refused; with superAdmin the dashboard opens.
  {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`admin: ${e.message}`));
    await signIn(page, BASE, email);
    await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
    await page.locator('#admin-denied, #admin-login').first().waitFor({ timeout: 20000 });
    await page.screenshot({ path: path.join(OUT, 'admin-denied.png') });
    results.push('admin without role: refused');
    await setStaff(email);
    await ctx.close();
    const ctx2 = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const p2 = await ctx2.newPage();
    p2.on('pageerror', (e) => errors.push(`admin: ${e.message}`));
    await signIn(p2, BASE, email);
    await p2.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
    await p2.locator('#admin-app').waitFor({ timeout: 30000 });
    await p2.waitForTimeout(2500);
    await p2.screenshot({ path: path.join(OUT, 'admin-overview.png') });
    results.push('admin with superAdmin: dashboard opens');
    await ctx2.close();
  }

  await browser.close();
  console.log(results.join('\n'));
  if (errors.length) {
    console.log('PAGE ERRORS:\n' + errors.join('\n'));
    process.exit(1);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
