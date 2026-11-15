/**
 * End-to-end flow against the Emulator Suite + seeded data, with screenshots at 390 px.
 * Prereqs: emulators running, data seeded (functions/lib/scripts/seed.js), `vite --mode emulators` on :5173.
 * Usage: node e2e/flow.cjs [baseUrl]
 */
const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');

const BASE = process.argv[2] || 'http://127.0.0.1:5173';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const shot = async (page, name) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log('shot', name);
};
const full = async (page, name) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log('shot', name, '(full)');
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  // 1. Sign up with email
  await page.goto(BASE);
  await page.getByRole('button', { name: 'Continue with email' }).waitFor();
  await shot(page, 'light-01-sign-in');
  await page.getByRole('button', { name: 'Continue with email' }).click();
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Your name').fill('Ravi');
  await page.getByLabel('Email').fill(`ravi${Date.now()}@example.test`);
  await page.getByLabel('Password').fill('password123');
  await shot(page, 'light-02-sign-up');
  await page.getByRole('button', { name: 'Create account' }).click();

  // 2. Onboarding
  await page.getByText('Choose your language').waitFor();
  await shot(page, 'light-03-onboarding-language');
  await page.click('#onboarding-next');
  await page.getByLabel('Year of birth').fill('1994');
  await page.getByRole('radio', { name: 'Male', exact: true }).click();
  await page.getByLabel('Height (cm)').fill('175');
  await page.getByLabel('Current weight (kg)').fill('78');
  await full(page, 'light-04-onboarding-about');
  await page.click('#onboarding-next');
  await page.getByLabel('Target weight (kg)').fill('72');
  await page.getByRole('radio', { name: /Moderately active/ }).click();
  await full(page, 'light-05-onboarding-goal');
  await page.click('#onboarding-next');
  await full(page, 'light-06-onboarding-food');
  await page.click('#onboarding-next');
  await full(page, 'light-07-onboarding-routine');
  await page.click('#onboarding-next');
  await page.getByRole('checkbox', { name: /I agree/ }).click();
  await full(page, 'light-08-onboarding-country-consent');
  await page.click('#onboarding-next');
  await page.getByText('Your daily targets').waitFor();
  // 32 y (born 1994, in 2026), male, 175 cm, 78 kg, moderate, lose → BMR 1718.75, TDEE 2664.1, 2164 kcal
  const targetsText = await page.textContent('body');
  assert(targetsText.includes('2164'), 'expected 2164 kcal target');
  await full(page, 'light-09-onboarding-targets');
  await page.click('#onboarding-finish');

  // 3. Home (empty day)
  await page.locator('#card-calories').waitFor();
  await shot(page, 'light-10-home-empty');

  // 4. Log food via search
  await page.getByRole('link', { name: 'Home' }).waitFor();
  await page.goto(`${BASE}/food`);
  await page.locator('#slot-breakfast').getByRole('button', { name: 'Add' }).click();
  await page.getByRole('searchbox').fill('idli');
  await page.getByText('Idli', { exact: true }).first().waitFor({ timeout: 15000 });
  await shot(page, 'light-11-food-search');
  await page.getByText('Idli', { exact: true }).first().click();
  await page.getByLabel('Quantity').fill('3');
  await shot(page, 'light-12-food-quantity');
  console.log('DBG', await page.getByRole('button', { name: 'Add food' }).evaluate((b) => { const r = b.getBoundingClientRect(); const t = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2); return JSON.stringify({ r: [r.x, r.y, r.width, r.height], vh: innerHeight, sy: scrollY, top: t && t.outerHTML.slice(0, 150), dialogs: document.querySelectorAll('[role=dialog]').length }); }));
  await page.getByRole('button', { name: 'Add food' }).click();
  await page.locator('#slot-breakfast').getByText('Idli').waitFor();
  // Add a USDA food too
  await page.locator('#slot-lunch').getByRole('button', { name: 'Add' }).click();
  await page.getByRole('searchbox').fill('rice cooked');
  await page.locator('ul button').first().waitFor({ timeout: 15000 });
  await page.locator('ul button').first().click();
  await page.getByRole('button', { name: 'Add food' }).click();
  await page.waitForTimeout(800);
  await full(page, 'light-13-food-log');

  // 5. Water, weight, sleep
  await page.goto(`${BASE}/health/water`);
  await page.getByRole('button', { name: '250 ml' }).click();
  await page.getByRole('button', { name: '500 ml' }).click();
  await full(page, 'light-14-health-water');
  await page.goto(`${BASE}/health/weight`);
  await page.getByLabel('Weight (kg)').fill('77.6');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(600);
  await full(page, 'light-15-health-weight');
  await page.goto(`${BASE}/health/sleep`);
  await page.getByRole('button', { name: 'Save' }).click();
  await full(page, 'light-16-health-sleep');
  await page.goto(`${BASE}/health/steps`);
  await full(page, 'light-17-health-steps');

  // 6. Workout
  await page.goto(`${BASE}/workouts`);
  await page.getByRole('button', { name: 'Start workout' }).last().click();
  await page.getByRole('button', { name: 'Add exercise' }).click();
  await page.getByRole('searchbox', { name: 'Search exercises' }).fill('push');
  await page.getByRole('button', { name: 'Add exercise' }).first().click();
  await page.getByLabel('Reps').fill('12');
  await page.getByRole('button', { name: 'Done' }).first().click();
  await full(page, 'light-18-workout-session');
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await page.getByRole('tab', { name: 'History' }).click();
  await page.getByText('ago').count();
  await shot(page, 'light-19-workout-history');
  await page.getByRole('tab', { name: 'Exercise library' }).click();
  await shot(page, 'light-20-workout-library');

  // 7. Store, planner, progress, coach, settings
  await page.goto(`${BASE}/store`);
  await page.click('#store-notify');
  await page.getByText('You are on the list').first().waitFor();
  await shot(page, 'light-21-store');
  await page.goto(`${BASE}/planner`);
  await shot(page, 'light-22-planner');
  await page.goto(`${BASE}/health/progress`);
  await full(page, 'light-23-progress');
  await page.goto(`${BASE}/settings`);
  await full(page, 'light-24-settings');
  await page.goto(BASE);
  await page.click('#coach-button');
  await shot(page, 'light-25-coach-locked');
  await page.keyboard.press('Escape');

  // 8. Persistence: reload and check real totals
  await page.reload();
  await page.locator('#card-calories').waitFor();
  await page.waitForTimeout(1200);
  const homeText = await page.locator('#card-calories').textContent();
  assert(/Eaten\s*\d{3}/.test(homeText.replace(/,/g, '')), `home should show eaten calories, got: ${homeText}`);
  await full(page, 'light-26-home-logged');

  // 9. Dark mode
  await page.goto(`${BASE}/settings`);
  await page.getByRole('tab', { name: 'Dark' }).click();
  for (const [route, name] of [['/', 'home'], ['/food', 'food'], ['/health/water', 'water'], ['/workouts', 'workouts'], ['/store', 'store'], ['/settings', 'settings']]) {
    await page.goto(BASE + route);
    await page.waitForTimeout(600);
    await shot(page, `dark-${name}`);
  }
  await page.goto(`${BASE}/settings`);
  await page.getByRole('tab', { name: 'Light' }).click();

  // 10. Telugu and Arabic (RTL)
  for (const lang of ['te', 'ar', 'hi', 'ta']) {
    await page.goto(`${BASE}/settings`);
    await page.getByLabel(/Language|భాష|اللغة|भाषा|மொழி/).first().selectOption(lang);
    await page.waitForTimeout(700);
    await page.goto(BASE);
    await page.waitForTimeout(900);
    if (lang === 'ar') assert.strictEqual(await page.evaluate(() => document.documentElement.dir), 'rtl');
    await shot(page, `lang-${lang}-home`);
    await page.goto(`${BASE}/food`);
    await shot(page, `lang-${lang}-food`);
  }
  await page.goto(`${BASE}/settings`);
  await page.locator('select').first().selectOption('en');

  // 11. Sign out
  await page.goto(`${BASE}/settings`);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByRole('button', { name: 'Continue with email' }).waitFor();

  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
})().catch((e) => {
  console.error('FLOW FAILED:', e.message);
  process.exit(1);
});
