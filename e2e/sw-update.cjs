/**
 * Update check with an old version cached: open the built site (service worker installs and caches it), rebuild a
 * newer version, open the app again: the "new version is available" banner must appear, and Refresh must load the
 * new version. Usage: node e2e/sw-update.cjs <url> <command that rebuilds dist>
 */
const { chromium } = require('playwright');
const { execSync } = require('child_process');
const assert = require('assert');
const [url, rebuild] = process.argv.slice(2);
(async () => {
  const dir = require('fs').mkdtempSync(require('os').tmpdir() + '/swtest-');
  const ctx = await chromium.launchPersistentContext(dir, { viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready, null, { timeout: 30000 });
  await p.evaluate(async () => { await navigator.serviceWorker.ready; });
  const oldSw = await p.evaluate(async () => (await navigator.serviceWorker.getRegistration()).active.scriptURL);
  const oldAssets = await p.evaluate(() => [...document.scripts].map((s) => s.src).filter(Boolean).join(' '));
  console.log('old version cached by the service worker');
  execSync(rebuild, { stdio: 'ignore' });
  console.log('new version built');
  // Reopen the app (next app open).
  await p.close();
  const p2 = await ctx.newPage();
  await p2.goto(url, { waitUntil: 'load' });
  await p2.locator('#update-prompt').waitFor({ timeout: 30000 });
  console.log('banner shown: ' + (await p2.locator('#update-prompt').innerText()).split('\n')[0]);
  await Promise.all([p2.waitForEvent('load', { timeout: 30000 }), p2.locator('#update-prompt button', { hasText: 'Refresh' }).click()]);
  await p2.waitForTimeout(1500);
  const newAssets = await p2.evaluate(() => [...document.scripts].map((s) => s.src).filter(Boolean).join(' '));
  assert(newAssets !== oldAssets, 'still running the old files after Refresh');
  console.log('after Refresh the new version runs (' + oldSw.split('/').pop() + ' replaced)');
  await ctx.close();
})().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
