/**
 * Screenshot review on the six form factors (emulators). Usage: node e2e/review.cjs [routes,comma] [devices,comma] [theme]
 * Writes docs/screenshots/devices/<device>-<theme>-<route>.png
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { DEVICES, signUp, onboard, signIn, assertNoHorizontalScroll } = require('./helpers.cjs');
const { execFileSync } = require('child_process');
const req = require('module').createRequire(path.join(__dirname, '..', 'functions', 'package.json'));

const BASE = 'http://127.0.0.1:5173';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots', 'devices');
fs.mkdirSync(OUT, { recursive: true });
const ROUTES = { home: '/', food: '/food', water: '/health/water', weight: '/health/weight', sleep: '/health/sleep', steps: '/health/steps', progress: '/health/progress', workouts: '/workouts', planner: '/planner', store: '/store', plans: '/plans', settings: '/settings' };
const routes = (process.argv[2] || Object.keys(ROUTES).join(',')).split(',');
const devs = (process.argv[3] || Object.keys(DEVICES).join(',')).split(',');
const themes = (process.argv[4] || 'light').split(',');

(async () => {
  const browser = await chromium.launch();
  const email = `review${Date.now()}@example.test`;
  {
    const ctx = await browser.newContext({ ...DEVICES.desktop, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const page = await ctx.newPage();
    await signUp(page, BASE, email);
    await onboard(page);
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    const { initializeApp } = req('firebase-admin/app');
    const { getAuth } = req('firebase-admin/auth');
    initializeApp({ projectId: 'demo-fitmeai' });
    const uid = (await getAuth().getUserByEmail(email)).uid;
    execFileSync('node', [path.join(__dirname, 'seed-history.cjs'), uid], { env: { ...process.env, FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' }, stdio: 'inherit' });
    await ctx.close();
  }
  const problems = [];
  for (const d of devs) {
    for (const theme of themes) {
      const ctx = await browser.newContext({ ...DEVICES[d], locale: 'en-IN', timezoneId: 'Asia/Kolkata', colorScheme: theme });
      await ctx.addInitScript((th) => localStorage.setItem('fit_me_theme', th), theme);
      const page = await ctx.newPage();
      page.on('pageerror', (e) => problems.push(`${d}: ${e.message}`));
      await signIn(page, BASE, email);
      for (const r of routes) {
        await page.goto(BASE + ROUTES[r], { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1200);
        try {
          await assertNoHorizontalScroll(page, `${d} ${r}`);
        } catch (e) {
          problems.push(e.message);
        }
        await page.screenshot({ path: path.join(OUT, `${d}-${theme}-${r}.png`), fullPage: true });
      }
      await ctx.close();
      console.log('done', d, theme);
    }
  }
  console.log(problems.length ? `PROBLEMS:\n${problems.join('\n')}` : 'no problems');
  await browser.close();
})().catch((e) => {
  console.error('REVIEW FAILED:', e.message.split('\n').slice(0, 4).join(' | '));
  process.exit(1);
});
