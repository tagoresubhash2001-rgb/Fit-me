/**
 * Full end-to-end flow on the six target devices (iPhone 13, Pixel 7, iPad portrait and landscape,
 * laptop, desktop) with a fresh account each, plus a no-horizontal-scroll sweep at 360/768/1024/1280/1920.
 * Usage: node e2e/devices-flow.cjs [baseUrl] [device,device] [--shots]
 * Live: uses real accounts; delete them afterwards with e2e/_cleanup-user.cjs (the script prints the emails).
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const { chromium } = require('playwright');
const { DEVICES, tap, signUp, onboard, assertNoHorizontalScroll } = require('./helpers.cjs');

const BASE = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : 'http://127.0.0.1:5173';
const only = (process.argv[3] && !process.argv[3].startsWith('-') ? process.argv[3] : Object.keys(DEVICES).join(',')).split(',');
const SHOTS = process.argv.includes('--shots');
const live = BASE.startsWith('https://');
const OUT = path.join(__dirname, '..', 'docs', 'screenshots', live ? 'live-devices' : 'devices-flow');
fs.mkdirSync(OUT, { recursive: true });

/** Food add/edit panel: a dialog on phones and tablet portrait, the inline side panel from 1024 px. */
const panel = (page) => page.locator('[role="dialog"], aside[aria-label="Quick add"] section').last();

async function flow(browser, name) {
  const ctx = await browser.newContext({ ...DEVICES[name], locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  if (process.env.DBG) page.on('console', (m) => m.text().startsWith('DBG') && console.log('   ', name, m.text()));
  page.on('console', (m) => /Content Security Policy|Refused to/i.test(m.text()) && errors.push(m.text().slice(0, 160)));
  const shot = async (n) => SHOTS && page.screenshot({ path: path.join(OUT, `${name}-${n}.png`), fullPage: true });
  const email = `fitme-${live ? 'live' : 'e2e'}-${name}-${Date.now()}@example.com`;
  const width = page.viewportSize().width;
  const desktop = width >= 1280;

  // Sign up + onboarding with all new controls
  await signUp(page, BASE, email);
  await onboard(page);
  await shot('01-home');

  // Upgrade -> Plans (header button; sidebar entry on desktop)
  await page.click(desktop ? '#side-upgrade' : '#header-upgrade');
  await page.getByRole('heading', { name: 'Plans' }).waitFor();
  assert((await page.textContent('main')).includes('₹199'), 'INR prices');
  await shot('02-plans');

  // Food: add with stepper, multiplier and unit; edit meal slot; delete with undo
  await page.goto(`${BASE}/food`, { waitUntil: 'domcontentloaded' });
  await page.locator('#slot-breakfast').getByRole('button', { name: 'Add' }).click();
  const add = panel(page);
  await add.getByRole('searchbox').fill('idli');
  await add.getByText('Idli', { exact: true }).first().waitFor({ timeout: 30000 });
  await tap(page, add.getByText('Idli', { exact: true }).first());
  await tap(page, add.getByRole('button', { name: 'Increase' }));
  await tap(page, add.getByRole('button', { name: '2×' }));
  await add.getByLabel('Unit').selectOption('g');
  await tap(page, add.getByRole('button', { name: 'Add food' }));
  await page.locator('#slot-breakfast').getByText('Idli').waitFor();
  await page.locator('#slot-breakfast').getByRole('button', { name: 'More actions' }).first().click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  // Let the panel finish entering, then make sure the change took before saving.
  const meal = panel(page).getByLabel('Meal');
  await meal.waitFor();
  await page.waitForTimeout(400);
  for (let i = 0; i < 5 && (await meal.inputValue()) !== 'dinner'; i++) {
    await meal.selectOption('dinner');
    await page.waitForTimeout(300);
  }
  assert.strictEqual(await meal.inputValue(), 'dinner', 'meal slot selected');
  await shot('03-food-edit');
  await tap(page, panel(page).getByRole('button', { name: 'Save' }));
  await page.locator('#slot-dinner').getByText('Idli').waitFor();
  await page.locator('#slot-dinner').getByRole('button', { name: 'More actions' }).first().click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Undo' }).last().click();
  await page.locator('#slot-dinner').getByText('Idli').waitFor();

  // Water: presets, +/-, custom with units, edit and delete with undo
  await page.goto(`${BASE}/health/water`, { waitUntil: 'domcontentloaded' });
  const presets = page.getByRole('group', { name: 'Quick amounts' });
  await presets.getByRole('button', { name: /^250 ml/ }).click();
  await presets.getByRole('button', { name: /^500 ml/ }).click();
  await page.click('#water-plus');
  await page.click('#water-minus');
  await page.getByLabel('Custom amount: Unit').selectOption('floz');
  await page.getByLabel('Custom amount', { exact: true }).fill('8');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'More actions' }).first().click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  await page.getByRole('dialog').getByLabel('Amount', { exact: true }).fill('300');
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'Save' }));
  await page.getByText('300 ml').first().waitFor();
  await page.getByRole('button', { name: 'More actions' }).first().click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Undo' }).last().click();
  await page.getByText('300 ml').first().waitFor();
  await page.getByRole('tab', { name: '30 days' }).click();
  await shot('04-water');

  // Planner: week and month views
  await page.goto(`${BASE}/planner`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('grid').waitFor();
  assert.strictEqual(await page.getByRole('gridcell').count(), 7, 'week view has 7 days');
  await page.getByRole('tab', { name: 'Month' }).click();
  await page.waitForTimeout(400);
  assert((await page.getByRole('gridcell').count()) >= 28, 'month view');
  await shot('05-planner-month');
  await page.getByRole('tab', { name: 'Week' }).click();

  // Jai / Jaya: docked panel on desktop, sheet elsewhere
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.locator('#card-calories').waitFor();
  await page.click('#coach-button');
  if (desktop) await page.locator('#coach-dock').waitFor();
  else await page.getByRole('dialog').getByRole('tab', { name: 'Jaya' }).waitFor();
  await shot('06-coach');
  await page.keyboard.press('Escape');
  if (desktop) await page.locator('#coach-dock').getByRole('button', { name: 'Close coach' }).click();

  // Settings, then sign out
  await page.goto(`${BASE}/settings`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Preferences' }).waitFor();
  await shot('07-settings');
  await page.getByRole('button', { name: 'Sign out' }).last().click();
  await page.getByRole('button', { name: 'Continue with email' }).waitFor({ timeout: 20000 });
  await ctx.close();
  return { email, errors };
}

/** Every screen at five widths: no horizontal page scroll. */
async function widthSweep(browser) {
  const email = `fitme-${live ? 'live' : 'e2e'}-widths-${Date.now()}@example.com`;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
  const page = await ctx.newPage();
  await signUp(page, BASE, email);
  await onboard(page);
  const routes = ['/', '/food', '/health/water', '/health/weight', '/health/sleep', '/health/steps', '/health/progress', '/workouts', '/planner', '/store', '/plans', '/settings'];
  for (const w of [360, 768, 1024, 1280, 1920]) {
    await page.setViewportSize({ width: w, height: 900 });
    for (const r of routes) {
      await page.goto(BASE + r, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(700);
      await assertNoHorizontalScroll(page, `${w}px ${r}`);
    }
    console.log('no horizontal scroll at', w);
  }
  await ctx.close();
  return email;
}

(async () => {
  const browser = await chromium.launch();
  const created = [];
  let failed = false;
  for (const d of only) {
    try {
      const { email, errors } = await flow(browser, d);
      created.push(email);
      console.log(`${d}: PASS`, errors.length ? `page errors: ${errors.join(' | ')}` : '(no page errors)');
      if (errors.length) failed = true;
    } catch (e) {
      failed = true;
      console.log(`${d}: FAIL ${e.message.split('\n').slice(0, 3).join(' | ')}`);
    }
  }
  if (only.length > 1) {
    try {
      created.push(await widthSweep(browser));
    } catch (e) {
      failed = true;
      console.log('width sweep: FAIL', e.message.split('\n')[0]);
    }
  }
  await browser.close();
  console.log('ACCOUNTS', created.join(','));
  process.exit(failed ? 1 : 0);
})();
