/** Shared steps for the end-to-end flows (emulator and live). */
const path = require('path');
const assert = require('assert');
const { devices } = require('playwright');

/** The six target form factors. */
const DEVICES = {
  'iphone-13': { ...devices['iPhone 13'] },
  'pixel-7': { ...devices['Pixel 7'] },
  'ipad-portrait': { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPad (gen 7)'].userAgent },
  'ipad-landscape': { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPad (gen 7) landscape'].userAgent },
  laptop: { viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 },
  desktop: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
};

/** Real pointer tap at the element's centre (works inside sheets where the page scroll is locked). */
async function tap(page, locator) {
  await locator.waitFor();
  await locator.scrollIntoViewIfNeeded();
  const b = await locator.boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
}

async function signUp(page, base, email, name = 'Ravi') {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Continue with email' }).click();
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Your name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('a-long-test-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByText('Choose your language').waitFor({ timeout: 30000 });
}

/** Onboarding with every new control: DOB dropdowns, unit switching, multi-goal, allergy chips, country to state. */
async function onboard(page) {
  await page.click('#onboarding-next');
  await page.getByLabel('Day', { exact: true }).selectOption('15');
  await page.getByLabel('Month', { exact: true }).selectOption('2');
  await page.getByLabel('Year', { exact: true }).selectOption('1994');
  await page.getByText('Age 32').waitFor();
  await page.getByRole('radio', { name: 'Male', exact: true }).click();
  await page.getByLabel('Height: Unit').selectOption('ftin');
  await page.getByLabel('Height (ft)').fill('5');
  await page.getByLabel('Height (in)').fill('9');
  await page.getByLabel('Height: Unit').selectOption('cm');
  await page.getByLabel('Height (cm)').fill('175');
  await page.getByLabel('Current weight: Unit').selectOption('lb');
  await page.getByLabel('Current weight (lb)').fill('171.96');
  await page.getByLabel('Current weight: Unit').selectOption('kg');
  assert.strictEqual(await page.getByLabel('Current weight (kg)').inputValue(), '78');
  await page.click('#onboarding-next');
  await page.getByText('Recommended for you').first().waitFor();
  const lose = page.getByRole('checkbox', { name: /^Lose weight/ });
  if ((await lose.getAttribute('aria-checked')) !== 'true') await lose.click();
  await page.getByRole('checkbox', { name: /^Gain weight/ }).click();
  await page.getByText(/cannot be chosen together/).waitFor();
  await page.getByRole('checkbox', { name: /^Sleep better/ }).click();
  await page.getByLabel('Target weight (kg)').fill('72');
  await page.getByRole('radio', { name: /Moderately active/ }).click();
  await page.click('#onboarding-next');
  await page.getByRole('button', { name: 'Peanuts' }).click();
  await page.getByLabel('Type another allergy').fill('Mango');
  await page.getByLabel('Type another allergy').press('Enter');
  await page.getByRole('button', { name: 'Remove Mango' }).waitFor();
  await page.click('#onboarding-next');
  await page.click('#onboarding-next');
  await page.getByRole('button', { name: 'Country' }).click();
  await page.getByRole('combobox').fill('india');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'State or region' }).click();
  await page.getByRole('combobox').fill('telan');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'State or region' }).getByText('Telangana').waitFor();
  await page.getByRole('checkbox', { name: /I agree/ }).click();
  await page.click('#onboarding-next');
  await page.getByText('Your daily targets').waitFor();
  assert((await page.textContent('body')).includes('2164'), 'expected 2164 kcal target');
  await page.click('#onboarding-finish');
  await page.locator('#card-calories').waitFor({ timeout: 30000 });
}

/** No horizontal page scroll at this size. */
async function assertNoHorizontalScroll(page, label) {
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  assert(sw <= cw + 1, `${label}: horizontal scroll (${sw} > ${cw})`);
}

module.exports = { DEVICES, tap, signUp, onboard, assertNoHorizontalScroll, path };

async function signIn(page, base, email) {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Continue with email' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('a-long-test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.locator('#card-calories').waitFor({ timeout: 30000 });
}
module.exports.signIn = signIn;
