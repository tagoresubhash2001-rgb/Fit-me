/**
 * Release gate: the site must render the sign-in screen in a real browser with no page errors and no
 * CSP violations, and register its service worker. Used before and after every Hosting deploy.
 * Usage: node e2e/render-check.cjs <url>
 */
const { chromium } = require('playwright');

const url = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const problems = [];
  for (const [name, viewport] of [
    ['phone', { width: 390, height: 844 }],
    ['tablet', { width: 1180, height: 820 }],
    ['desktop', { width: 1920, height: 1080 }],
  ]) {
    const page = await browser.newPage({ viewport });
    page.on('pageerror', (e) => problems.push(`${name}: page error: ${e.message}`));
    page.on('console', (m) => /Content Security Policy|Refused to/i.test(m.text()) && problems.push(`${name}: ${m.text().slice(0, 200)}`));
    await page.goto(url, { waitUntil: 'load' });
    await page
      .getByRole('button', { name: 'Continue with email' })
      .waitFor({ timeout: 30000 })
      .catch(() => problems.push(`${name}: sign-in screen did not render`));
    const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    if (sw > cw + 1) problems.push(`${name}: horizontal scroll`);
    if (name === 'desktop') {
      const reg = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return 'unsupported';
        const r = await Promise.race([navigator.serviceWorker.ready, new Promise((res) => setTimeout(() => res(null), 15000))]);
        return r ? 'ready' : 'none';
      });
      if (reg !== 'ready' && !url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) problems.push(`service worker: ${reg}`);
      console.log('service worker:', reg);
    }
    await page.close();
  }
  await browser.close();
  if (problems.length) {
    console.error(`RENDER CHECK FAILED for ${url}:\n${problems.join('\n')}`);
    process.exit(1);
  }
  console.log(`Render check OK: ${url}`);
})();
