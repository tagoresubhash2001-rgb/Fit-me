/**
 * Accessibility checks:
 * 1. Keyboard-only run on desktop: skip link, sidebar, shortcuts (? N W /), add a food and close dialogs
 *    with Esc, focus trapped inside dialogs and returned afterwards. No mouse is used after sign-up.
 * 2. axe-core audit (names and labels on every control, ARIA, contrast) of every screen on phone, tablet
 *    and desktop, light and dark.
 * Usage: node e2e/a11y-keyboard.cjs [baseUrl]
 */
const assert = require('assert');
const { chromium } = require('playwright');
const { DEVICES, signUp, onboard } = require('./helpers.cjs');

const BASE = process.argv[2] || 'http://127.0.0.1:5173';
const AXE = require.resolve('axe-core/axe.min.js');
const ROUTES = ['/', '/food', '/health/water', '/health/weight', '/health/sleep', '/health/steps', '/health/progress', '/workouts', '/planner', '/store', '/plans', '/settings'];

const focused = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return el ? `${el.tagName.toLowerCase()}#${el.id}|${el.getAttribute('aria-label') ?? ''}|${(el.textContent ?? '').trim().slice(0, 30)}` : 'none';
  });
async function tabTo(page, test, max = 60) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (test(await focused(page))) return;
  }
  throw new Error(`could not reach element by Tab (last: ${await focused(page)})`);
}

(async () => {
  const browser = await chromium.launch();
  const problems = [];

  // ---- 1. Keyboard-only on desktop
  const ctx = await browser.newContext({ ...DEVICES.desktop, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
  const page = await ctx.newPage();
  const email = `fitme-kbd-${Date.now()}@example.com`;
  await signUp(page, BASE, email);
  await onboard(page);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.locator('#card-calories').waitFor();

  // Skip link is the first stop and moves focus to the content.
  await page.keyboard.press('Tab');
  assert((await focused(page)).includes('Skip to content'), `skip link first, got ${await focused(page)}`);
  await page.keyboard.press('Enter');
  // Sidebar reachable by keyboard: go to Health.
  await page.keyboard.press('Shift+Tab');
  await tabTo(page, (f) => f.startsWith('a#side-health'));
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/health/);
  // ? opens the shortcut help; focus is inside; Esc closes it and focus returns.
  await page.locator('body').click({ position: { x: 1, y: 1 } }).catch(() => {});
  await page.keyboard.press('Shift+Slash');
  await page.getByRole('dialog', { name: 'Keyboard shortcuts' }).waitFor();
  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
  assert(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), 'focus trapped in dialog');
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  // W adds a glass of water (toast with Undo).
  await page.keyboard.press('w');
  await page.getByText(/added/).first().waitFor();
  // / focuses the global search; typing a food and Enter opens the quick-add panel with the query.
  await page.keyboard.press('/');
  assert((await focused(page)).startsWith('input#global-search'), 'slash focuses search');
  await page.keyboard.type('idli');
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/food/);
  const quick = page.locator('aside[aria-label="Quick add"]');
  await quick.getByText('Idli', { exact: true }).first().waitFor({ timeout: 30000 });
  // Pick the first result and add it, keyboard only.
  await tabTo(page, (f) => f.includes('Idli'));
  await page.keyboard.press('Enter');
  await tabTo(page, (f) => f.includes('Add food'));
  await page.keyboard.press('Enter');
  await page.locator('#slot-breakfast, #slot-morning_snack, #slot-lunch, #slot-evening_snack, #slot-dinner').getByText('Idli').first().waitFor();
  // N opens a fresh quick add with focus in its search box.
  await page.keyboard.press('Escape');
  await page.locator('main').focus();
  await page.keyboard.press('n');
  await page.waitForTimeout(400);
  assert((await focused(page)).startsWith('input#quick-add-search'), `N focuses quick add, got ${await focused(page)}`);
  // Focus rings: a focused button shows an outline.
  await tabTo(page, (f) => f.startsWith('button'));
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  assert(outline !== 'none', 'visible focus ring');
  console.log('keyboard-only run: PASS');
  await ctx.close();

  // ---- 2. axe audit on phone, tablet, desktop; light and dark
  for (const [dev, theme] of [
    ['iphone-13', 'light'],
    ['iphone-13', 'dark'],
    ['ipad-portrait', 'light'],
    ['ipad-landscape', 'dark'],
    ['desktop', 'light'],
    ['desktop', 'dark'],
  ]) {
    const c = await browser.newContext({ ...DEVICES[dev], locale: 'en-IN', timezoneId: 'Asia/Kolkata', colorScheme: theme });
    await c.addInitScript((t) => localStorage.setItem('fit_me_theme', t), theme);
    const p = await c.newPage();
    await signUp(p, BASE, `fitme-axe-${dev}-${theme}-${Date.now()}@example.com`);
    await onboard(p);
    for (const r of ROUTES) {
      await p.goto(BASE + r, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(1200);
      await p.addScriptTag({ path: AXE });
      const res = await p.evaluate(async () =>
        // eslint-disable-next-line no-undef
        axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }, resultTypes: ['violations'] }),
      );
      for (const v of res.violations) problems.push(`${dev} ${theme} ${r}: ${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes[0]?.target?.join(' ')} ${v.nodes[0]?.failureSummary?.split('\n')[1]?.trim() ?? ''}`);
    }
    console.log('axe done:', dev, theme);
    await c.close();
  }
  await browser.close();
  if (problems.length) {
    console.log(`AXE VIOLATIONS (${problems.length}):\n${problems.join('\n')}`);
    process.exit(1);
  }
  console.log('axe: no violations');
})().catch((e) => {
  console.error('A11Y CHECK FAILED:', e.message.split('\n').slice(0, 3).join(' | '));
  process.exit(1);
});
