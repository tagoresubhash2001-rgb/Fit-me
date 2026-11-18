/**
 * Records short videos of the main animations (Playwright video) on a phone and a desktop:
 * tiles filling in, tab switches (route transitions + sliding pill), a tile opening its screen
 * (shared element), the Plans period switch (prices counting), a sheet opening and closing, a toast,
 * and a row being deleted and restored. Usage: node e2e/motion-video.cjs [baseUrl]
 * Writes docs/videos/<device>-motion.webm (and frame strips under the scratch folder via ffmpeg).
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { DEVICES, signUp, onboard } = require('./helpers.cjs');

const BASE = process.argv[2] || 'http://127.0.0.1:5173';
const OUT = path.join(__dirname, '..', 'docs', 'videos');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  for (const dev of ['iphone-13', 'desktop']) {
    const size = DEVICES[dev].viewport;
    const ctx = await browser.newContext({ ...DEVICES[dev], locale: 'en-IN', timezoneId: 'Asia/Kolkata', recordVideo: { dir: OUT, size } });
    const page = await ctx.newPage();
    await signUp(page, BASE, `fitme-video-${dev}-${Date.now()}@example.com`);
    await onboard(page);
    const desktop = size.width >= 1280;
    const nav = (k) => page.click(desktop ? `#side-${k}` : `#nav-${k}`);
    await page.waitForTimeout(1500); // rings and bars fill in
    await page.locator('#card-water').getByRole('button', { name: /Add 250 ml/ }).click(); // toast + count up
    await page.waitForTimeout(1200);
    for (const k of ['planner', 'health', 'workouts', 'home']) {
      await nav(k); // route transition + sliding pill
      await page.waitForTimeout(700);
    }
    await page.locator('#card-water').locator('.card-press').click(); // shared element into Water
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'More actions' }).first().click();
    await page.getByRole('menuitem', { name: 'Delete' }).click(); // row slides out
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Undo' }).last().click(); // row comes back
    await page.waitForTimeout(900);
    await page.goto(`${BASE}/plans`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    for (const p of [/3 months/, /Yearly/, /Monthly/]) {
      await page.getByRole('tab', { name: p }).click(); // pill slides, prices count
      await page.waitForTimeout(800);
    }
    await page.locator('#plan-pro').getByRole('button', { name: /free trial/ }).click(); // sheet springs in
    await page.waitForTimeout(900);
    await page.keyboard.press('Escape'); // and out
    await page.waitForTimeout(900);
    const video = page.video();
    await ctx.close();
    const file = path.join(OUT, `${dev}-motion.webm`);
    fs.renameSync(await video.path(), file);
    console.log('video', file);
  }
  await browser.close();
})().catch((e) => {
  console.error('VIDEO FAILED:', e.message.split('\n')[0]);
  process.exit(1);
});
