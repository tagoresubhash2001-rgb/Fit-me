/**
 * Admin dashboard at 360, 390, 430, 768, 1024 and 1440 px (emulators): every section renders without sideways
 * scrolling; phones get the slide-in menu, 44 px touch targets and card tables; tablets the collapsible sidebar;
 * desktop the full sidebar. Screenshots: docs/screenshots/admin-responsive/<width>-<section>.png
 */
const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const { signUp, onboard, signIn, path } = require('./helpers.cjs');
const BASE = process.argv[2] || 'http://127.0.0.1:5173';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots', 'admin-responsive');
fs.mkdirSync(OUT, { recursive: true });
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
const req = require('module').createRequire(path.join(__dirname, '..', 'functions', 'package.json'));
const { initializeApp } = req('firebase-admin/app');
const { getAuth } = req('firebase-admin/auth');
initializeApp({ projectId: 'demo-fitmeai' });
const SECTIONS = ['', 'users', 'finance', 'plans', 'trials', 'coupons', 'content', 'foods', 'testimonials', 'notifications', 'features', 'settings', 'integrations', 'support', 'admins', 'logs'];
const WIDTHS = [360, 390, 430, 768, 1024, 1440];

(async () => {
  const browser = await chromium.launch();
  const email = `fitme-admin-resp-${Date.now()}@example.test`;
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    await signUp(p, BASE, email, 'Admin');
    await onboard(p);
    await p.locator('#card-calories').waitFor({ timeout: 30000 });
    await ctx.close();
  }
  await getAuth().setCustomUserClaims((await getAuth().getUserByEmail(email)).uid, { role: 'superAdmin' });
  const results = [];
  const errors = [];
  for (const w of WIDTHS) {
    const phone = w < 768;
    const ctx = await browser.newContext({ viewport: { width: w, height: phone ? 860 : 900 }, isMobile: phone, hasTouch: w < 1280, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${w}: ${e.message}`));
    await signIn(page, BASE, email);
    for (const s of SECTIONS) {
      await page.goto(`${BASE}/admin/${s}`, { waitUntil: 'domcontentloaded' });
      await page.locator('#admin-app').waitFor({ timeout: 30000 });
      await page.waitForTimeout(1800);
      const m = await page.evaluate(() => {
        const sw = document.documentElement.scrollWidth;
        const cw = document.documentElement.clientWidth;
        const small = [...document.querySelectorAll('#admin-app main :is(button, a[href], select, input:not([type=checkbox]):not([type=radio]):not([type=range]))')]
          .filter((el) => el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden')
          .map((el) => ({ h: el.getBoundingClientRect().height, t: (el.textContent || el.getAttribute('aria-label') || el.id || el.tagName).trim().slice(0, 30) }))
          .filter((x) => x.h > 0 && x.h < 43.5);
        const theadVisible = [...document.querySelectorAll('.admin-table thead')].some((t) => t.getBoundingClientRect().height > 2);
        return { overflow: sw > cw + 1, sw, cw, small: small.slice(0, 3), smallCount: small.length, theadVisible, tables: document.querySelectorAll('.admin-table').length };
      });
      const name = s || 'overview';
      assert(!m.overflow, `${w}px ${name}: sideways scroll ${m.sw} > ${m.cw}`);
      if (w < 1024) assert.equal(m.smallCount, 0, `${w}px ${name}: touch targets under 44px: ${JSON.stringify(m.small)}`);
      if (phone && m.tables) assert(!m.theadVisible, `${w}px ${name}: table header shown instead of cards`);
      await page.screenshot({ path: path.join(OUT, `${w}-${name}.png`), fullPage: false });
    }
    // Navigation pattern for this width.
    if (phone) {
      assert(await page.locator('#admin-menu').isVisible(), `${w}: menu button missing`);
      assert(!(await page.locator('#admin-sidebar').isVisible()), `${w}: sidebar should be hidden on phones`);
      await page.locator('#admin-menu').click();
      await page.locator('#admin-drawer').waitFor();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(OUT, `${w}-menu.png`) });
      await page.locator('#admin-drawer').getByText('User management').click();
      await page.locator('#admin-drawer').waitFor({ state: 'detached' });
      assert(page.url().endsWith('/admin/users'), `${w}: menu link went to ${page.url()}`);
    } else if (w < 1280) {
      const sb = await page.locator('#admin-sidebar').boundingBox();
      assert(sb && sb.width < 100, `${w}: sidebar should start collapsed (${sb?.width})`);
      await page.locator('#admin-collapse').click();
      await page.waitForTimeout(200);
      const open = await page.locator('#admin-sidebar').boundingBox();
      assert(open && open.width > 200, `${w}: sidebar did not expand`);
      await page.screenshot({ path: path.join(OUT, `${w}-sidebar-open.png`) });
    } else {
      const sb = await page.locator('#admin-sidebar').boundingBox();
      assert(sb && sb.width > 200, `${w}: full sidebar expected`);
    }
    results.push(`${w}px: all ${SECTIONS.length} sections OK (${phone ? 'slide-in menu, 44px targets, card tables' : w < 1280 ? 'collapsible sidebar' : 'full sidebar'})`);
    await ctx.close();
  }
  await browser.close();
  console.log(results.join('\n'));
  if (errors.length) {
    console.log('PAGE ERRORS', errors.slice(0, 5));
    process.exit(1);
  }
})().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
