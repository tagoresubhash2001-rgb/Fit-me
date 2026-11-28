/**
 * Short screen recordings of the Dynamic Island navbar: desktop (springs open, compact on scroll down, expands
 * on scroll up, features menu) and mobile (menu morph open and close).
 * Usage: node e2e/navbar-video.cjs <base> <out-dir>   -> navbar-desktop.webm, navbar-mobile.webm
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [base, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });

async function record(name, viewport, extra, steps) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, ...extra, recordVideo: { dir: out, size: viewport } });
  const p = await ctx.newPage();
  await p.goto(base + '/', { waitUntil: 'load' });
  await steps(p);
  const video = p.video();
  await ctx.close();
  await browser.close();
  fs.renameSync(await video.path(), path.join(out, `navbar-${name}.webm`));
  console.log('recorded', name);
}

(async () => {
  await record('desktop', { width: 1280, height: 720 }, {}, async (p) => {
    await p.waitForTimeout(1800);
    for (let y = 0; y <= 1400; y += 70) {
      await p.mouse.wheel(0, 70);
      await p.waitForTimeout(40);
    }
    await p.waitForTimeout(1200);
    for (let y = 0; y <= 600; y += 70) {
      await p.mouse.wheel(0, -70);
      await p.waitForTimeout(40);
    }
    await p.waitForTimeout(1000);
    await p.mouse.wheel(0, -3000);
    await p.waitForTimeout(800);
    await p.locator('#island-features').hover();
    await p.waitForTimeout(1500);
    await p.locator('#island').getByRole('link', { name: 'Download', exact: true }).click();
    await p.waitForTimeout(1800);
  });
  await record('mobile', { width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, async (p) => {
    await p.waitForTimeout(1800);
    await p.locator('#island-menu').tap();
    await p.waitForTimeout(1600);
    await p.locator('#island-menu').tap();
    await p.waitForTimeout(1200);
    await p.locator('#island-menu').tap();
    await p.waitForTimeout(900);
    await p.locator('[role="dialog"]').getByRole('link', { name: 'Features', exact: true }).tap();
    await p.waitForTimeout(1800);
  });
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
