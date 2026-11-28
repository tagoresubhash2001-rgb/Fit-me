/**
 * Website screenshots for review: home and download (full page, scrolled so reveal animations run) and the
 * navbar (desktop, mobile with the menu open). Usage: node e2e/site-shots.cjs <base> <out-prefix>
 */
const { chromium } = require('playwright');
const [base, prefix] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  for (const [kind, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp, ...(kind === 'mobile' ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { deviceScaleFactor: 1 }) });
    const p = await ctx.newPage();
    for (const path of ['/', '/download']) {
      await p.goto(base + path, { waitUntil: 'load' });
      await p.waitForTimeout(3000);
      for (let y = 0; y < 12000; y += 400) {
        await p.evaluate((v) => window.scrollTo(0, v), y);
        await p.waitForTimeout(250);
      }
      await p.evaluate(() => Promise.all([...document.images].map((i) => (i.loading = 'eager', i.complete ? null : new Promise((r) => (i.onload = i.onerror = r))))));
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.waitForTimeout(900);
      await p.screenshot({ path: `${prefix}-${kind}${path === '/' ? '-home' : '-download'}.png`, fullPage: true });
    }
    await p.goto(base + '/', { waitUntil: 'load' });
    await p.waitForTimeout(1500);
    if (kind === 'mobile') {
      const menu = p.locator('#island-menu, button[aria-label*="menu" i]').first();
      if (await menu.count()) {
        await menu.click();
        await p.waitForTimeout(800);
      }
    } else {
      const feat = p.locator('#island-features, button:has-text("Features")').first();
      if (await feat.count()) {
        await feat.click();
        await p.waitForTimeout(800);
      }
    }
    await p.screenshot({ path: `${prefix}-${kind}-navbar.png`, clip: { x: 0, y: 0, width: vp.width, height: kind === 'mobile' ? 844 : 420 } });
    await ctx.close();
  }
  await b.close();
})();
