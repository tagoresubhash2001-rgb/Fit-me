/** Admin dashboard per role in a real browser (emulators): which sections show, and every page renders. */
const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const { signUp, onboard, signIn, assertNoHorizontalScroll, path } = require('./helpers.cjs');
const BASE = process.argv[2] || 'http://127.0.0.1:5173';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots', 'admin-v4');
fs.mkdirSync(OUT, { recursive: true });
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
const req = require('module').createRequire(path.join(__dirname, '..', 'functions', 'package.json'));
const { initializeApp } = req('firebase-admin/app');
const { getAuth } = req('firebase-admin/auth');
initializeApp({ projectId: 'demo-fitmeai' });
const setRole = async (email, role) => getAuth().setCustomUserClaims((await getAuth().getUserByEmail(email)).uid, { role });
const ALL = ['users', 'finance', 'plans', 'trials', 'coupons', 'content', 'foods', 'testimonials', 'notifications', 'features', 'settings', 'integrations', 'support', 'admins', 'logs'];

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const mk = async (role) => {
    const email = `fitme-admin-${role}-${Date.now()}@example.test`;
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const p = await ctx.newPage();
    await signUp(p, BASE, email, role);
    await onboard(p);
    await p.locator('#card-calories').waitFor({ timeout: 30000 });
    await ctx.close();
    await setRole(email, role);
    const ctx2 = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const page = await ctx2.newPage();
    page.on('pageerror', (e) => errors.push(`${role}: ${e.message}`));
    await signIn(page, BASE, email);
    await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
    await page.locator('#admin-app').waitFor({ timeout: 30000 });
    return { page, ctx: ctx2 };
  };
  const links = async (page) => page.$$eval('#admin-app aside nav a', (as) => as.map((a) => a.getAttribute('href')));

  // Content editor: no Finance, no API keys; opening /admin/finance falls back to the overview.
  {
    const { page, ctx } = await mk('content');
    const l = await links(page);
    assert(!l.some((h) => h.endsWith('/finance')), 'content editor sees Finance');
    assert(!l.some((h) => h.endsWith('/integrations')), 'content editor sees API keys');
    assert(l.some((h) => h.endsWith('/content')), 'content editor misses Content');
    await page.goto(`${BASE}/admin/finance`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    assert(!(await page.locator('#admin-finance').count()), 'content editor opened Finance');
    console.log('content editor: no Finance, no API keys, Content available; /admin/finance refused');
    await ctx.close();
  }
  // Finance: Finance yes, Content no.
  {
    const { page, ctx } = await mk('finance');
    const l = await links(page);
    assert(l.some((h) => h.endsWith('/finance')) && !l.some((h) => h.endsWith('/content')), 'finance sections wrong');
    console.log('finance: Finance available, Content hidden');
    await ctx.close();
  }
  // Super admin: every section opens and renders without errors or sideways scroll.
  {
    const { page, ctx } = await mk('superAdmin');
    const l = await links(page);
    for (const s of ALL) assert(l.some((h) => h.endsWith(`/${s}`)), `super admin misses ${s}`);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT, 'overview.png'), fullPage: true });
    for (const s of ALL) {
      await page.goto(`${BASE}/admin/${s}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2200);
      assert(await page.locator('main h1, main [id^="admin-"]').count(), `${s} did not render`);
      await assertNoHorizontalScroll(page, `admin ${s}`);
      await page.screenshot({ path: path.join(OUT, `${s}.png`), fullPage: true });
    }
    console.log(`super admin: all ${ALL.length + 1} sections render`);
    await ctx.close();
  }
  await browser.close();
  if (errors.length) {
    console.log('PAGE ERRORS:\n' + errors.join('\n'));
    process.exit(1);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
