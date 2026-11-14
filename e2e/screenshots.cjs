/**
 * Captures every screen at 390 px wide in light and dark mode into docs/screenshots/.
 * Usage: npm run build && npx vite preview --port 4173 &  node e2e/screenshots.cjs [baseUrl]
 */
const { chromium } = require('playwright');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:4173';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');

const PROFILE = {
  name: 'Ravi', age: 30, gender: 'male', height: 175, weight: 78, targetWeight: 72,
  activity: 'lightly_active', goal: 'fat_loss', disease: 'none', foodPreference: 'veg',
  region: 'andhra', lifestyle: 'busy_professional', hasOnboarded: true, selectedCoach: 'jaya', theme: 'light',
};

async function shot(page, name, { scroll = true } = {}) {
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = 844;
  const parts = scroll ? Math.min(8, Math.ceil(total / (vh - 140))) : 1;
  for (let i = 0; i < parts; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * (vh - 140));
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(OUT, `${name}${parts > 1 ? `-${i + 1}` : ''}.png`) });
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  console.log('saved', name, parts);
}

(async () => {
  const browser = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    // Onboarding (fresh user)
    let ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    let page = await ctx.newPage();
    await page.addInitScript((t) => localStorage.setItem('fit_me_theme', t), theme);
    await page.goto(BASE);
    for (let step = 1; step <= 6; step++) {
      if (step === 1) await page.fill('input', 'Ravi').catch(() => {});
      await shot(page, `${theme}-onboarding-${step}`);
      const next = page.getByRole('button', { name: /continue/i });
      if (step < 6 && (await next.count())) await next.click();
    }
    await ctx.close();

    // Main app (onboarded user)
    ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    page = await ctx.newPage();
    await page.addInitScript(
      ([t, p]) => {
        localStorage.setItem('fit_me_theme', t);
        localStorage.setItem('fit_me_profile_v2', JSON.stringify({ ...p, theme: t }));
      },
      [theme, PROFILE],
    );
    await page.goto(BASE);
    for (const tab of ['home', 'planner', 'trackings', 'workout', 'store']) {
      await page.click(`#nav-tab-${tab}`);
      await shot(page, `${theme}-${tab === 'trackings' ? 'health' : tab}`);
    }
    await page.click('#nav-tab-home');
    await page.click('#floating-ai-orb-trigger');
    await shot(page, `${theme}-coach`, { scroll: false });
    await page.click('#floating-ai-orb-trigger');
    await page.getByRole('button', { name: 'Profile', exact: true }).click();
    await shot(page, `${theme}-profile`);
    await page.keyboard.press('Escape');
    await page.goto(BASE);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await shot(page, `${theme}-settings`);
    await ctx.close();
  }
  await browser.close();
})();
