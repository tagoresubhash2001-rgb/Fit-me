/**
 * PWA checks: Chrome installability (manifest, icons, service worker), offline start, and the
 * "update available" prompt. Usage: node e2e/pwa-check.cjs <url> [--update]
 * With --update the script waits while you deploy/rebuild a new version, then expects the prompt.
 */
const { chromium } = require('playwright');
const assert = require('assert');

const url = process.argv[2];
const waitForUpdate = process.argv.includes('--update');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'load' }); // now controlled by the worker

  // 1. Installability as Chrome reports it (same checks that drive the install button).
  const cdp = await ctx.newCDPSession(page);
  const { installabilityErrors: errors } = await cdp.send('Page.getInstallabilityErrors');
  const manifest = await cdp.send('Page.getAppManifest');
  const m = JSON.parse(manifest.data || '{}');
  console.log('installability errors:', errors.length ? JSON.stringify(errors) : 'none');
  console.log('manifest:', m.name, '|', m.display, '| icons', (m.icons || []).length, '| screenshots', (m.screenshots || []).length);
  assert.strictEqual(errors.length, 0, 'not installable');

  // 2. Offline: the app shell still opens, including deep links.
  await ctx.setOffline(true);
  for (const path of ['/', '/food', '/health/water']) {
    await page.goto(new URL(path, url).href, { waitUntil: 'load' });
    await page.getByRole('button', { name: 'Continue with email' }).or(page.locator('#card-calories')).first().waitFor({ timeout: 15000 });
    console.log('offline OK:', path);
  }
  await ctx.setOffline(false);

  // 3. Update prompt after a new release.
  if (waitForUpdate) {
    await page.goto(url, { waitUntil: 'load' });
    console.log('READY: deploy or rebuild a new version now; checking for 5 minutes...');
    const deadline = Date.now() + 5 * 60 * 1000;
    let shown = false;
    while (Date.now() < deadline && !shown) {
      await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
      shown = await page.locator('#update-prompt').isVisible();
      if (!shown) await page.waitForTimeout(5000);
    }
    assert(shown, 'update prompt not shown');
    const before = await page.evaluate(() => [...document.scripts].map((s) => s.src).join());
    await Promise.all([page.waitForNavigation({ timeout: 20000 }), page.getByRole('button', { name: 'Refresh' }).click()]);
    const after = await page.evaluate(() => [...document.scripts].map((s) => s.src).join());
    assert.notStrictEqual(before, after, 'still on the old version after Refresh');
    console.log('update prompt OK: new version loaded after Refresh');
  }
  await browser.close();
  console.log('PWA check OK:', url);
})().catch((e) => {
  console.error('PWA CHECK FAILED:', e.message);
  process.exit(1);
});
