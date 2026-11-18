// Captures the install-UI screenshots in public/screenshots from the emulator app (run e2e/review.cjs first).
// Usage: node scripts/capture-pwa-screenshots.cjs <review-account-email>
const { chromium } = require('playwright');
const { signIn } = require('../e2e/helpers.cjs');
(async () => {
  const b = await chromium.launch();
  for (const [file, opts] of [
    ['public/screenshots/desktop-home.png', { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }],
    ['public/screenshots/phone-home.png', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ]) {
    const ctx = await b.newContext({ ...opts, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const p = await ctx.newPage();
    await signIn(p, 'http://127.0.0.1:5173', process.argv[2]);
    await p.waitForTimeout(1500);
    await p.screenshot({ path: file });
    console.log('wrote', file);
    await ctx.close();
  }
  await b.close();
})();
