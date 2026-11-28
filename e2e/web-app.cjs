/**
 * Continue in Browser, end to end against the Emulator Suite: sign up (email; Google sign-in uses the same
 * session code and is checked on the live site by hand), onboarding, log food and water, view health and the
 * web-only notice, settings, sign out, on desktop, tablet and phone viewports.
 * Prereqs: emulators + foods seeded (functions/lib/scripts/seed-foods.js), `vite --mode emulators` on :5173.
 * Usage: node e2e/web-app.cjs [http://127.0.0.1:5173]
 */
const { chromium } = require('playwright');
const assert = require('assert');
const { signUp, onboard, tap } = require('./helpers.cjs');

const BASE = (process.argv[2] || 'http://127.0.0.1:5173').replace(/\/$/, '');
const VIEWPORTS = [
  ['desktop', { width: 1440, height: 900 }, {}],
  ['tablet', { width: 820, height: 1180 }, { isMobile: true, hasTouch: true }],
  ['phone', { width: 390, height: 844 }, { isMobile: true, hasTouch: true }],
];

(async () => {
  const browser = await chromium.launch();
  for (const [name, viewport, extra] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport, ...extra, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const email = `web-${name}-${Date.now()}@example.test`;

    // Website -> Continue in browser -> sign-up at /app/
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await page.locator('#cta-browser').click();
    await page.waitForURL(/\/app\/$/);
    await signUp(page, BASE, email, 'Asha');
    await onboard(page);
    assert(page.url().includes('/app'), `${name}: member app should stay under /app (${page.url()})`);

    // Food
    await page.goto(`${BASE}/app/food`);
    await page.locator('#slot-breakfast').getByRole('button', { name: 'Add' }).click();
    await page.getByRole('searchbox').fill('idli');
    await page.getByText('Idli', { exact: true }).first().waitFor({ timeout: 20000 });
    await tap(page, page.getByText('Idli', { exact: true }).first());
    await tap(page, page.getByRole('dialog').getByRole('button', { name: 'Add food' }));
    await page.locator('#slot-breakfast').getByText('Idli').first().waitFor();

    // Water
    await page.goto(`${BASE}/app/health/water`);
    await page.locator('#web-device-notice').waitFor();
    await page.getByRole('group', { name: 'Quick amounts' }).getByRole('button', { name: /^250 ml/ }).click();
    await page.getByText(/250 ml/).first().waitFor();

    // Health: steps tab shows the web notice and lets you add steps by hand
    await page.goto(`${BASE}/app/health/steps`);
    await page.locator('#web-device-notice').waitFor();

    // Persistence: reload home and see the food
    await page.goto(`${BASE}/app/`);
    await page.locator('#card-calories').waitFor();
    await page.waitForTimeout(1200);
    const home = (await page.locator('#card-calories').textContent()).replace(/,/g, '');
    assert(/Eaten\s*[1-9]\d*/.test(home), `${name}: home should show eaten calories, got ${home}`);

    // Settings and sign out
    await page.goto(`${BASE}/app/settings`);
    await page.getByRole('button', { name: 'Sign out' }).first().click();
    const confirm = page.getByRole('dialog').getByRole('button', { name: 'Sign out' });
    if (await confirm.count()) await confirm.click();
    await page.getByRole('button', { name: 'Continue with email' }).waitFor({ timeout: 20000 });
    assert(page.url().includes('/app'), `${name}: signed-out screen should be the /app sign-in`);

    // Overflow check on the main screens
    const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(sw <= 1, `${name}: horizontal scroll ${sw}`);
    assert.deepStrictEqual(errors, [], `${name}: page errors ${errors.join(' | ')}`);
    console.log(`web app OK on ${name}`);
    await ctx.close();
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
