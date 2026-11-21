/**
 * Store screenshots (Google Play phone 1080 x 2400 and 10" tablet) against the Emulator Suite with a fresh account.
 * Prereqs: emulators + `vite --mode emulators` on :5173. Output: docs/store/screenshots.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const { tap, signUp, onboard, signIn, path } = require('./helpers.cjs');
const BASE = process.argv[2] || 'http://127.0.0.1:5173';
const OUT = path.join(__dirname, '..', 'docs', 'store', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const email = `fitme-store-${Date.now()}@example.test`;
  {
    const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const p = await ctx.newPage();
    await signUp(p, BASE, email, 'Priya');
    await onboard(p);
    await p.locator('#card-calories').waitFor({ timeout: 30000 });
    await ctx.close();
  }
  for (const [kind, vp, dsf] of [['phone', { width: 412, height: 915 }, 2.625], ['tablet', { width: 800, height: 1280 }, 2]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf, isMobile: true, hasTouch: true, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const p = await ctx.newPage();
    await signIn(p, BASE, email);
    const shot = async (n) => {
      await p.waitForTimeout(900);
      await p.screenshot({ path: path.join(OUT, `${kind}-${n}.png`) });
    };
    await shot('1-home');
    await p.goto(`${BASE}/food`, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1500);
    await shot('2-food');
    await p.goto(`${BASE}/health/steps`, { waitUntil: 'domcontentloaded' });
    await shot('3-steps');
    await p.goto(`${BASE}/workouts`, { waitUntil: 'domcontentloaded' });
    await tap(p, p.locator('#open-route'));
    await p.locator('#route-tracker').waitFor();
    await shot('4-route');
    await p.goto(`${BASE}/plans`, { waitUntil: 'domcontentloaded' });
    await shot('5-plans');
    await p.goto(`${BASE}/settings`, { waitUntil: 'domcontentloaded' });
    await p.locator('#devices').waitFor({ timeout: 20000 });
    await p.locator('#devices').scrollIntoViewIfNeeded();
    await shot('6-devices');
    await ctx.close();
  }
  await browser.close();
  console.log('store screenshots written');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
