/**
 * Website screenshots from the demo account, EMULATOR ONLY.
 * 1. Creates a demo member through the real sign-up and onboarding (Auth + Firestore emulators).
 * 2. Seeds a full week with scripts/seed-demo.ts.
 * 3. Captures six screens in screenshot mode (?screenshots=1: no plans, prices, upgrade or trial UI) at
 *    390 x 845 CSS px, 1x and 2x, and writes AVIF + WebP to public/screenshots/app/.
 * Prereqs: `firebase emulators:start --project demo-fitmeai` and `npx vite --mode emulators --port 5173`.
 * Usage: node e2e/capture-site-shots.cjs [http://127.0.0.1:5173]
 */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { signUp, onboard, signIn } = require('./helpers.cjs');

const BASE = (process.argv[2] || 'http://127.0.0.1:5173').replace(/\/$/, '');
const OUT = path.join(__dirname, '..', 'public', 'screenshots', 'app');
const RAW = path.join(__dirname, '..', 'docs', 'screenshots', 'site-raw');
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(RAW, { recursive: true });

const req = require('module').createRequire(path.join(__dirname, '..', 'functions', 'package.json'));
const { initializeApp } = req('firebase-admin/app');
const { getAuth } = req('firebase-admin/auth');
initializeApp({ projectId: 'demo-fitmeai' });

const SHOTS = [
  ['home', '/app/', async (p) => p.locator('#card-calories').waitFor()],
  ['food', '/app/food', async (p) => p.getByText('Idli with sambar').first().waitFor()],
  ['activity', '/app/health/steps', async (p) => p.locator('#heart-rate-card').waitFor()],
  [
    'workouts',
    '/app/workouts',
    async (p) => {
      await p.getByRole('tab', { name: 'History' }).or(p.getByRole('button', { name: 'History', exact: true })).first().click();
      await p.getByText('Morning run').first().waitFor();
    },
  ],
  [
    'coach',
    '/app/',
    async (p) => {
      await p.locator('#coach-button').click();
      await p.getByRole('tab', { name: 'Jai' }).or(p.getByRole('radio', { name: 'Jai' })).or(p.getByRole('button', { name: 'Jai', exact: true })).first().click();
      await p.getByText(/fastest 5 km/).waitFor({ timeout: 20000 });
    },
  ],
  ['insights', '/app/health/progress', async (p) => p.waitForTimeout(500)],
];

(async () => {
  const browser = await chromium.launch();
  const email = `demo-priya-${Date.now()}@example.test`;
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 845 }, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const p = await ctx.newPage();
    await signUp(p, BASE, email, 'Priya');
    await onboard(p);
    await ctx.close();
  }
  const { uid } = await getAuth().getUserByEmail(email);
  execFileSync('npx', ['tsx', 'scripts/seed-demo.ts', uid], { stdio: 'inherit', env: process.env, cwd: path.join(__dirname, '..') });

  for (const dsf of [1, 2]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 845 }, deviceScaleFactor: dsf, isMobile: true, hasTouch: true, locale: 'en-IN', timezoneId: 'Asia/Kolkata', colorScheme: 'light', reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/app/?screenshots=1`, { waitUntil: 'domcontentloaded' });
    await signIn(p, BASE, email);
    for (const [name, url, ready] of SHOTS) {
      await p.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' });
      await ready(p).catch(async (e) => {
        await p.screenshot({ path: path.join(RAW, `FAILED-${name}.png`) });
        throw e;
      });
      await p.waitForTimeout(1500);
      // Never capture the loading splash: the screen's own content must still be there.
      await p.waitForFunction(() => !document.querySelector('.boot') && !document.querySelector('[role="status"][aria-label="Loading…"]'), null, { timeout: 30000 });
      await p.waitForTimeout(800);
      const bad = await p.locator('[data-plan-ui]:visible, #update-prompt:visible').count();
      if (bad) throw new Error(`${name}: plan or upgrade UI visible in screenshot mode`);
      const png = await p.screenshot();
      fs.writeFileSync(path.join(RAW, `${name}${dsf === 2 ? '@2x' : ''}.png`), png);
      const suffix = dsf === 2 ? '@2x' : '';
      await sharp(png).webp({ quality: 82 }).toFile(path.join(OUT, `${name}${suffix}.webp`));
      await sharp(png).avif({ quality: 55 }).toFile(path.join(OUT, `${name}${suffix}.avif`));
      console.log('captured', name, `${dsf}x`);
    }
    await ctx.close();
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
