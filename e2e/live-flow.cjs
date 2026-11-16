/**
 * Full live test on https://fit-me1.web.app with a fresh test account. Needs an admin credential in
 * GOOGLE_APPLICATION_CREDENTIALS (only to verify Firestore and to grant/remove temporary Pro for the coach).
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=<key> node e2e/live-flow.cjs
 */
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');
const req = require('module').createRequire(path.join(__dirname, '..', 'functions', 'package.json'));
const { initializeApp } = req('firebase-admin/app');
const { getFirestore, Timestamp } = req('firebase-admin/firestore');
const { getAuth } = req('firebase-admin/auth');

const BASE = process.argv[2] || 'https://fit-me1.web.app';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots', 'live');
initializeApp({ projectId: 'fit-me1' });
const db = getFirestore();
const email = `fitme-live-test-${Date.now()}@example.com`;

const shot = async (page, name, full = false) => {
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
  console.log('shot', name);
};
const tap = async (page, loc) => {
  await loc.waitFor();
  const b = await loc.boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let uid = null;
  try {
    // Sign up
    await page.goto(BASE);
    await page.getByRole('button', { name: 'Continue with email' }).click();
    await page.getByRole('button', { name: 'New here? Create an account' }).click();
    await page.getByLabel('Your name').fill('Live Test');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('a-long-test-password');
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.getByText('Choose your language').waitFor({ timeout: 20000 });
    uid = (await getAuth().getUserByEmail(email)).uid;
    console.log('signed up uid', uid);

    // Onboarding
    await shot(page, 'light-01-onboarding-language');
    await page.click('#onboarding-next');
    await page.getByLabel('Year of birth').fill('1994');
    await page.getByRole('radio', { name: 'Male', exact: true }).click();
    await page.getByLabel('Height (cm)').fill('175');
    await page.getByLabel('Current weight (kg)').fill('78');
    await shot(page, 'light-02-onboarding-about', true);
    await page.click('#onboarding-next');
    await page.getByLabel('Target weight (kg)').fill('72');
    await page.getByRole('radio', { name: /Moderately active/ }).click();
    await shot(page, 'light-03-onboarding-goal', true);
    await page.click('#onboarding-next');
    await page.click('#onboarding-next');
    await page.click('#onboarding-next');
    await page.getByRole('checkbox', { name: /I agree/ }).click();
    await page.click('#onboarding-next');
    await page.getByText('Your daily targets').waitFor();
    assert((await page.textContent('body')).includes('2164'), 'target 2164 kcal');
    await shot(page, 'light-04-onboarding-targets', true);
    await page.click('#onboarding-finish');
    await page.locator('#card-calories').waitFor({ timeout: 20000 });
    await shot(page, 'light-05-home-empty');

    // Food (curated + USDA from the live database)
    await page.goto(`${BASE}/food`);
    await page.locator('#slot-breakfast').getByRole('button', { name: 'Add' }).click();
    await page.getByRole('searchbox').fill('idli');
    await page.getByText('Idli', { exact: true }).first().waitFor({ timeout: 20000 });
    await shot(page, 'light-06-food-search');
    await tap(page, page.getByText('Idli', { exact: true }).first());
    await page.getByLabel('Quantity').fill('3');
    await tap(page, page.getByRole('button', { name: 'Add food' }));
    await page.locator('#slot-breakfast').getByText('Idli').waitFor();
    await page.locator('#slot-lunch').getByRole('button', { name: 'Add' }).click();
    await page.getByRole('searchbox').fill('rice cooked');
    await page.getByRole('dialog').locator('ul button').first().waitFor({ timeout: 20000 });
    await tap(page, page.getByRole('dialog').locator('ul button').first());
    await tap(page, page.getByRole('button', { name: 'Add food' }));
    await page.waitForTimeout(1200);
    await shot(page, 'light-07-food-log', true);

    // Water, weight, sleep, steps
    await page.goto(`${BASE}/health/water`);
    await page.getByRole('button', { name: '250 ml' }).click();
    await page.getByRole('button', { name: '500 ml' }).click();
    await shot(page, 'light-08-health-water', true);
    await page.goto(`${BASE}/health/weight`);
    await page.getByLabel('Weight (kg)').fill('77.6');
    await page.getByRole('button', { name: 'Save' }).click();
    await shot(page, 'light-09-health-weight', true);
    await page.goto(`${BASE}/health/sleep`);
    await page.getByRole('button', { name: 'Save' }).click();
    await shot(page, 'light-10-health-sleep', true);
    await page.goto(`${BASE}/health/steps`);
    await shot(page, 'light-11-health-steps', true);

    // Workout
    await page.goto(`${BASE}/workouts`);
    await page.getByRole('button', { name: 'Start workout' }).last().click();
    await page.getByRole('button', { name: 'Add exercise' }).click();
    await page.getByRole('searchbox', { name: 'Search exercises' }).fill('push-up');
    await tap(page, page.getByRole('dialog').getByRole('button', { name: 'Add exercise' }).first());
    await page.getByLabel('Reps').fill('12');
    await page.getByRole('button', { name: 'Done' }).first().click();
    await shot(page, 'light-12-workout-session', true);
    await page.getByRole('button', { name: 'Finish workout' }).click();
    await page.getByRole('tab', { name: 'History' }).click();
    await shot(page, 'light-13-workout-history');
    await page.getByRole('tab', { name: 'Exercise library' }).click();
    await shot(page, 'light-14-workout-library');

    // Other screens
    await page.goto(`${BASE}/store`);
    await page.click('#store-notify');
    await page.getByText('You are on the list').first().waitFor();
    await shot(page, 'light-15-store');
    await page.goto(`${BASE}/planner`);
    await shot(page, 'light-16-planner');
    await page.goto(`${BASE}/health/progress`);
    await shot(page, 'light-17-progress', true);
    await page.goto(`${BASE}/settings`);
    await shot(page, 'light-18-settings', true);

    // Reload and confirm saved
    await page.goto(BASE);
    await page.reload();
    await page.locator('#card-calories').waitFor();
    await page.waitForTimeout(2000);
    const home = (await page.locator('#card-calories').textContent()).replace(/,/g, '');
    assert(/Eaten\s*\d{3}/.test(home), `home shows eaten calories: ${home}`);
    await shot(page, 'light-19-home-after-reload');
    const count = async (c) => (await db.collection(`users/${uid}/${c}`).where('status', '==', 'active').count().get()).data().count;
    const saved = { profile: (await db.doc(`users/${uid}`).get()).exists, foodLogs: await count('foodLogs'), waterLogs: await count('waterLogs'), weightLogs: await count('weightLogs'), sleepLogs: await count('sleepLogs'), workoutLogs: await count('workoutLogs'), waitlist: (await db.doc(`storeWaitlist/${uid}`).get()).exists };
    console.log('FIRESTORE', JSON.stringify(saved));
    assert(saved.profile && saved.foodLogs === 2 && saved.waterLogs === 2 && saved.weightLogs === 1 && saved.workoutLogs === 1, 'data saved in Firestore');

    // Coach with temporary Pro
    await db.doc(`entitlements/${uid}`).set({ plan: 'pro', expiresAt: Timestamp.fromMillis(Date.now() + 60 * 60 * 1000), source: 'live-test' });
    await page.reload();
    await page.locator('#card-calories').waitFor();
    await page.waitForTimeout(1500);
    await page.click('#coach-button');
    await page.getByRole('tab', { name: 'Jaya' }).click();
    await page.getByRole('textbox', { name: /Ask about food/ }).fill('What should I eat for dinner today to stay within my calories?');
    await shot(page, 'light-20-coach-question');
    await tap(page, page.getByRole('button', { name: 'Send' }));
    const reply = await page.locator('[role="dialog"] .self-start').filter({ hasNotText: 'Thinking' }).last().textContent({ timeout: 60000 }).catch(() => null);
    await page.waitForTimeout(1500);
    const msgs = (await db.collection(`users/${uid}/aiThreads/jaya/messages`).orderBy('createdAt').get()).docs.map((d) => d.data());
    const assistant = msgs.find((m) => m.role === 'assistant');
    console.log('COACH', assistant ? `reply (${assistant.text.length} chars): ${assistant.text.slice(0, 220).replace(/\n/g, ' ')}` : `no reply; UI says: ${reply}`);
    await shot(page, 'light-21-coach-reply');
    await db.doc(`entitlements/${uid}`).delete();
    console.log('temporary Pro removed');

    // Dark mode screens
    await page.keyboard.press('Escape');
    await page.goto(`${BASE}/settings`);
    await page.getByRole('tab', { name: 'Dark' }).click();
    for (const [route, name] of [['/', 'home'], ['/food', 'food'], ['/health/water', 'water'], ['/health/weight', 'weight'], ['/health/sleep', 'sleep'], ['/health/progress', 'progress'], ['/workouts', 'workouts'], ['/planner', 'planner'], ['/store', 'store'], ['/settings', 'settings']]) {
      await page.goto(BASE + route);
      await shot(page, `dark-${name}`);
    }
    await page.goto(BASE);
    await page.click('#coach-button');
    await shot(page, 'dark-coach');
    await page.keyboard.press('Escape');
    await page.goto(`${BASE}/settings`);
    await page.getByRole('tab', { name: 'Light' }).click();

    // Clean up: delete the test account in the app (tests the deleteAccount function live)
    await page.getByRole('button', { name: 'Delete account' }).click();
    await page.getByLabel('Type DELETE to confirm').fill('DELETE');
    await tap(page, page.getByRole('dialog').getByRole('button', { name: 'Delete account' }));
    await page.getByRole('button', { name: 'Continue with email' }).waitFor({ timeout: 60000 });
    const gone = !(await db.doc(`users/${uid}`).get()).exists && !(await getAuth().getUser(uid).then(() => true).catch(() => false));
    console.log('account deleted in app:', gone);
    uid = gone ? null : uid;
  } finally {
    console.log(errors.length ? `PAGE ERRORS: ${errors.join(' | ')}` : 'no page errors');
    if (uid) {
      await db.doc(`entitlements/${uid}`).delete().catch(() => {});
      console.log('test user left in place:', uid);
    }
    await browser.close();
  }
})().catch((e) => {
  console.error('LIVE FLOW FAILED:', e.message.split('\n')[0], [...e.stack.matchAll(/live-flow.cjs:(\d+)/g)].map((m) => m[1]).join(','));
  process.exit(1);
});
