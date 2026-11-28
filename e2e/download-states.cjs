/**
 * Download page: device detection (Android, iPhone, iPad incl. iPadOS desktop user agent, desktop) and the three
 * iOS states from app_config/ios (empty -> browser, TestFlight only, App Store). EMULATOR ONLY (writes app_config).
 * Prereqs: emulators + `vite --mode emulators` on :5173. Usage: node e2e/download-states.cjs [base]
 */
const { chromium } = require('playwright');
const path = require('path');
if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('emulator only');
const req = require('module').createRequire(path.join(__dirname, '..', 'functions', 'package.json'));
const { initializeApp } = req('firebase-admin/app');
const { getFirestore } = req('firebase-admin/firestore');
initializeApp({ projectId: 'demo-fitmeai' });
const db = getFirestore();
const BASE = (process.argv[2] || 'http://127.0.0.1:5173').replace(/\/$/, '');

const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
};
const EXPECT = { android: 'android', iphone: 'ios', ipad: 'ios', desktop: 'browser' };
const problems = [];

(async () => {
  const browser = await chromium.launch();
  await db.doc('app_config/android').set({ latestVersionName: '2.0.1', latestVersionCode: 201, fileSizeMB: 11.4, releaseDate: '27 Nov 2026' });
  for (const [dev, ua] of Object.entries(UA)) {
    const ctx = await browser.newContext({ userAgent: ua, viewport: dev === 'desktop' ? { width: 1280, height: 900 } : { width: 390, height: 844 }, hasTouch: dev !== 'desktop', ...(dev === 'ipad' ? { isMobile: true } : {}) });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/download`, { waitUntil: 'load' });
    const rec = await p.locator('[data-recommended]').getAttribute('data-recommended', { timeout: 15000 }).catch(() => null);
    if (rec !== EXPECT[dev]) problems.push(`${dev}: recommended ${rec}, expected ${EXPECT[dev]}`);
    const qr = await p.locator('#download-qr').count();
    if ((dev === 'desktop') !== (qr === 1)) problems.push(`${dev}: QR shown = ${qr === 1}`);
    if (dev === 'android') {
      await p.getByText('Version 2.0.1').waitFor({ timeout: 15000 }).catch(() => problems.push('android: version from app_config not shown'));
      const href = await p.locator('#download-android').getAttribute('href');
      if (href !== '/download/android') problems.push(`android: download link ${href}`);
    }
    console.log(dev, '->', rec);
    await ctx.close();
  }
  const states = [
    [{}, 'browser', '#download-ios-browser'],
    [{ testflightUrl: 'https://testflight.apple.com/join/AbCdEf12' }, 'testflight', '#download-testflight'],
    [{ testflightUrl: 'https://testflight.apple.com/join/AbCdEf12', appStoreUrl: 'https://apps.apple.com/app/id1234567890' }, 'appstore', '#download-appstore'],
  ];
  for (const [cfg, mode, sel] of states) {
    await db.doc('app_config/ios').set(cfg);
    const ctx = await browser.newContext({ userAgent: UA.iphone, viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/download`, { waitUntil: 'load' });
    const got = await p.locator('[data-ios-mode]').getAttribute('data-ios-mode', { timeout: 15000 }).catch(() => null);
    if (got !== mode) problems.push(`ios ${mode}: page shows ${got}`);
    if (!(await p.locator(sel).count())) problems.push(`ios ${mode}: ${sel} missing`);
    if (/coming soon|waitlist/i.test(await p.locator('main').innerText())) problems.push(`ios ${mode}: "coming soon" or waitlist text`);
    await p.screenshot({ path: path.join(__dirname, '..', 'docs', 'screenshots', 'before-after', `download-ios-${mode}.png`), fullPage: true });
    console.log('ios', mode, 'OK?', got === mode);
    await ctx.close();
  }
  await db.doc('app_config/ios').delete();
  await browser.close();
  if (problems.length) {
    console.error('DOWNLOAD STATES FAILED:\n' + problems.join('\n'));
    process.exit(1);
  }
  console.log('Download states OK');
})();
