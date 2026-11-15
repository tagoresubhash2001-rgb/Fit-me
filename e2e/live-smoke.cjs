/** Live-site check at 390 px: app shell, sign-in screen (light + dark), sign-up attempt. Usage: node e2e/live-smoke.cjs [url] */
const { chromium } = require('playwright');
const path = require('path');
const URL = process.argv[2] || 'https://fit-me1.web.app';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots', 'live');
(async () => {
  const browser = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-IN', timezoneId: 'Asia/Kolkata', colorScheme: theme });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript((t) => localStorage.setItem('fit_me_theme', t), theme);
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Continue with email' }).waitFor({ timeout: 20000 });
    await page.screenshot({ path: path.join(OUT, `${theme}-sign-in.png`) });
    await page.getByRole('button', { name: 'Continue with email' }).click();
    await page.getByRole('button', { name: 'New here? Create an account' }).click();
    await page.getByLabel('Email').fill(`live-check-${Date.now()}@example.com`);
    await page.getByLabel('Password').fill('a-long-test-password');
    await page.getByRole('button', { name: 'Create account' }).click();
    const outcome = await Promise.race([
      page.getByRole('alert').first().waitFor({ timeout: 15000 }).then(async () => `error shown: "${(await page.getByRole('alert').first().textContent()).trim()}"`),
      page.getByText('Choose your language').waitFor({ timeout: 15000 }).then(() => 'signed up, onboarding shown'),
    ]).catch(() => 'no visible result');
    await page.screenshot({ path: path.join(OUT, `${theme}-sign-up-attempt.png`) });
    console.log(theme, '|', outcome, '| page errors:', errors.length ? errors.join('; ') : 'none');
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error('LIVE CHECK FAILED:', e.message); process.exit(1); });
