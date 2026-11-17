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
require('fs').mkdirSync(path.join(OUT, 'sweep'), { recursive: true });
const shot = async (page, name) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log('shot', name);
};
/** Real pointer tap at the element's centre (used inside bottom sheets, where the page scroll is locked). */
const tap = async (page, locator) => {
  await locator.waitFor();
  const b = await locator.boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
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

  // 2. Onboarding: DOB dropdowns, height/weight with unit switching, multi-goal, allergy chips, country -> state
  await page.getByText('Choose your language').waitFor();
  await shot(page, 'light-03-onboarding-language');
  await page.click('#onboarding-next');
  await page.getByLabel('Day', { exact: true }).selectOption('15');
  await page.getByLabel('Month', { exact: true }).selectOption('2');
  await page.getByLabel('Year', { exact: true }).selectOption('1994');
  await page.getByText('Age 32').waitFor();
  // Days follow the month: February 1994 has 28 days
  assert.strictEqual(await page.locator('select[aria-label="Day"] option').count(), 29);
  await page.getByRole('radio', { name: 'Male', exact: true }).click();
  await page.getByLabel('Height: Unit').selectOption('ftin');
  await page.getByLabel('Height (ft)').fill('5');
  await page.getByLabel('Height (in)').fill('9');
  await page.getByLabel('Height: Unit').selectOption('cm');
  assert.strictEqual(await page.getByLabel('Height (cm)').inputValue(), '175.3');
  await page.getByLabel('Height (cm)').fill('175');
  await page.getByLabel('Current weight: Unit').selectOption('lb');
  await page.getByLabel('Current weight (lb)').fill('171.96');
  await page.getByLabel('Current weight: Unit').selectOption('kg');
  assert.strictEqual(await page.getByLabel('Current weight (kg)').inputValue(), '78');
  await full(page, 'light-04-onboarding-about');
  await page.click('#onboarding-next');
  // BMI 25.5 -> "lose" is recommended; lose + gain conflict is blocked
  await page.getByText('Recommended for you').first().waitFor();
  const lose = page.getByRole('checkbox', { name: /^Lose weight/ });
  if ((await lose.getAttribute('aria-checked')) !== 'true') await lose.click();
  await page.getByRole('checkbox', { name: /^Gain weight/ }).click();
  await page.getByText(/cannot be chosen together/).waitFor();
  assert.strictEqual(await page.getByRole('checkbox', { name: /^Gain weight/ }).getAttribute('aria-checked'), 'false');
  await page.getByRole('checkbox', { name: /^Sleep better/ }).click();
  await page.getByRole('button', { name: 'Main goal', exact: true }).waitFor();
  await page.getByLabel('Target weight (kg)').fill('72');
  await page.getByRole('radio', { name: /Moderately active/ }).click();
  await full(page, 'light-05-onboarding-goal');
  await page.click('#onboarding-next');
  await page.getByRole('button', { name: 'Peanuts' }).click();
  await page.getByLabel('Type another allergy').fill('Mango');
  await page.getByLabel('Type another allergy').press('Enter');
  await page.getByRole('button', { name: 'Remove Mango' }).waitFor();
  await page.getByRole('button', { name: 'Jain' }).click();
  await full(page, 'light-06-onboarding-food');
  await page.click('#onboarding-next');
  await full(page, 'light-07-onboarding-routine');
  await page.click('#onboarding-next');
  await page.getByRole('button', { name: 'Country' }).click();
  await page.getByRole('combobox').fill('india');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'State or region' }).click();
  await page.getByRole('combobox').fill('telan');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'State or region' }).getByText('Telangana').waitFor();
  await page.getByLabel('City (optional)').fill('Hyderabad');
  await page.getByRole('checkbox', { name: /I agree/ }).click();
  await full(page, 'light-08-onboarding-country-consent');
  await page.click('#onboarding-next');
  await page.getByText('Your daily targets').waitFor();
  // 32 y, male, 175 cm, 78 kg, moderate, primary goal lose -> BMR 1718.75, TDEE 2664.1, 2164 kcal
  const targetsText = await page.textContent('body');
  assert(targetsText.includes('2164'), 'expected 2164 kcal target');
  await full(page, 'light-09-onboarding-targets');
  await page.click('#onboarding-finish');

  // 3. Home (empty day) and Upgrade -> Plans
  await page.locator('#card-calories').waitFor();
  await shot(page, 'light-10-home-empty');
  await page.click('#header-upgrade');
  await page.getByRole('heading', { name: 'Plans' }).waitFor();
  const plansText = await page.textContent('main');
  assert(plansText.includes('₹199') && plansText.includes('₹399'), 'expected INR prices on Plans');
  await full(page, 'light-10b-plans');
  await page.click('#choose-premium');
  await page.getByText(/Payments are launching soon/).first().waitFor();
  await page.getByRole('button', { name: 'You are on the list' }).waitFor();

  // 4. Log food via search with stepper and unit dropdown
  await page.goto(`${BASE}/food`);
  await page.locator('#slot-breakfast').getByRole('button', { name: 'Add' }).click();
  await page.getByRole('searchbox').fill('idli');
  await page.getByText('Idli', { exact: true }).first().waitFor({ timeout: 15000 });
  await shot(page, 'light-11-food-search');
  await tap(page, page.getByText('Idli', { exact: true }).first());
  const dialog = page.getByRole('dialog');
  await tap(page, dialog.getByRole('button', { name: 'Increase' }));
  await tap(page, dialog.getByRole('button', { name: '2×' }));
  await dialog.getByLabel('Unit').selectOption('g');
  await shot(page, 'light-12-food-quantity');
  await tap(page, dialog.getByRole('button', { name: 'Add food' }));
  await page.locator('#slot-breakfast').getByText('Idli').waitFor();
  // Allergy warning: peanut food shows the warning icon in search
  await page.locator('#slot-lunch').getByRole('button', { name: 'Add' }).click();
  await page.getByRole('searchbox').fill('peanut butter');
  await page.getByRole('dialog').getByLabel('Contains one of your allergens').first().waitFor({ timeout: 15000 });
  await page.getByRole('searchbox').fill('rice cooked');
  await page.getByRole('dialog').locator('ul button').first().waitFor({ timeout: 15000 });
  await tap(page, page.getByRole('dialog').locator('ul button').first());
  await tap(page, page.getByRole('button', { name: 'Add food' }));
  await page.waitForTimeout(800);
  await full(page, 'light-13-food-log');
  // Edit the idli entry: quantity and meal slot, then delete with undo
  await page.locator('#slot-breakfast').getByRole('button', { name: 'More actions' }).first().click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  await page.getByRole('dialog').getByLabel('Meal').selectOption('dinner');
  await shot(page, 'light-13b-food-edit');
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'Save' }));
  await page.locator('#slot-dinner').getByText('Idli').waitFor();
  await page.locator('#slot-dinner').getByRole('button', { name: 'More actions' }).first().click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Undo' }).last().click();
  await page.locator('#slot-dinner').getByText('Idli').waitFor();

  // 5. Water: +/- around the total, presets, custom with units, edit and delete with undo
  await page.goto(`${BASE}/health/water`);
  const presets = page.getByRole('group', { name: 'Quick amounts' });
  await presets.getByRole('button', { name: /^250 ml/ }).click();
  await presets.getByRole('button', { name: /^500 ml/ }).click();
  await page.click('#water-plus');
  await page.click('#water-minus');
  await page.getByLabel('Custom amount: Unit').selectOption('floz');
  await page.getByLabel('Custom amount', { exact: true }).fill('8');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.waitForTimeout(600);
  await full(page, 'light-14-health-water');
  const waterRows = page.locator('ul li').filter({ hasText: /ml/ });
  assert((await waterRows.count()) >= 3, 'expected water entries');
  await page.getByRole('button', { name: 'More actions' }).first().click();
  await page.getByRole('menuitem', { name: 'Edit' }).click();
  await page.getByRole('dialog').getByLabel('Amount', { exact: true }).fill('300');
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'Save' }));
  await page.getByText('300 ml').first().waitFor();
  await page.getByRole('button', { name: 'More actions' }).first().click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Undo' }).last().click();
  await page.getByText('300 ml').first().waitFor();

  // Weight, sleep, steps
  await page.goto(`${BASE}/health/weight`);
  await page.getByLabel(/^Weight \(kg\)/).first().fill('77.6');
  await page.getByRole('button', { name: 'Save' }).first().click();
  await page.waitForTimeout(600);
  await full(page, 'light-15-health-weight');
  await page.goto(`${BASE}/health/sleep`);
  await page.getByRole('button', { name: 'Save' }).first().click();
  await page.waitForTimeout(600);
  await full(page, 'light-16-health-sleep');
  await page.goto(`${BASE}/health/steps`);
  await full(page, 'light-17-health-steps');

  // 6. Workout
  await page.goto(`${BASE}/workouts`);
  await page.getByRole('button', { name: 'Start workout' }).last().click();
  await page.getByRole('button', { name: 'Add exercise' }).click();
  await page.getByRole('searchbox', { name: 'Search exercises' }).fill('push');
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'Add exercise' }).first());
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

  // 9b. Every screen at 390 px and 1280 px, light and dark (full page), plus key sheets
  const ROUTES = [['/', 'home'], ['/food', 'food'], ['/health/water', 'water'], ['/health/weight', 'weight'], ['/health/sleep', 'sleep'], ['/health/steps', 'steps'], ['/health/progress', 'progress'], ['/workouts', 'workouts'], ['/planner', 'planner'], ['/store', 'store'], ['/plans', 'plans'], ['/settings', 'settings']];
  for (const theme of ['Light', 'Dark']) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/settings`);
    await page.getByRole('tab', { name: theme }).click();
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      for (const [route, name] of ROUTES) {
        await page.goto(BASE + route);
        await page.waitForTimeout(900);
        await page.screenshot({ path: path.join(OUT, 'sweep', `${theme.toLowerCase()}-${width}-${name}.png`), fullPage: true });
      }
      await page.goto(`${BASE}/food`);
      await page.locator('#slot-snacks, #slot-evening_snack').first().getByRole('button', { name: 'Add' }).click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, 'sweep', `${theme.toLowerCase()}-${width}-sheet-add-food.png`) });
      await page.keyboard.press('Escape');
      await page.goto(`${BASE}/settings`);
      await page.getByRole('button', { name: 'Edit profile' }).first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, 'sweep', `${theme.toLowerCase()}-${width}-sheet-edit-profile.png`) });
      await page.keyboard.press('Escape');
      await page.goto(BASE);
      await page.click('#coach-button');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, 'sweep', `${theme.toLowerCase()}-${width}-sheet-coach.png`) });
      await page.keyboard.press('Escape');
      console.log('sweep', theme, width);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
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
  await page.getByRole('heading', { name: 'Settings' }).waitFor();
  await page.waitForTimeout(800);

  // 11. Sign out
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByRole('button', { name: 'Continue with email' }).waitFor();

  console.log(errors.length ? `PAGE ERRORS:\n${errors.join('\n')}` : 'no page errors');
  await browser.close();
})().catch((e) => {
  console.error('FLOW FAILED:', e.message.split('\n').slice(0, 6).join(' | '), [...e.stack.matchAll(/flow.cjs:(\d+)/g)].map((m) => m[1]).join(','));
  process.exit(1);
});
