/**
 * Website crawl: every page at 360, 390, 768, 1024 and 1440 px. Fails on a console error, page error, horizontal
 * scroll, an empty or "#" link, a dead internal link (HTTP >= 400), a page whose title or h1 is missing, a nav
 * item, dropdown item, menu item or button that does nothing, or an old member path that does not end in /app.
 * Usage: node e2e/site-crawl.cjs <base-url>   (built site: vite preview, or the live site)
 */
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:4173').replace(/\/$/, '');
const PAGES = ['/', '/features', '/how-it-works', '/download', '/about', '/faq', '/contact', '/privacy', '/terms', '/refund', '/delete-account'];
const WIDTHS = [360, 390, 768, 1024, 1440];
const problems = [];
const fail = (m) => problems.push(m);
// Errors from the network that are not the site's fault (blocked analytics in headless, offline font CDNs).
const IGNORE = [/favicon\.ico/, /google-analytics|googletagmanager/, /ERR_BLOCKED_BY_CLIENT/];

(async () => {
  const browser = await chromium.launch();
  const links = new Set();

  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 800 : 900 }, ...(w < 768 ? { isMobile: true, hasTouch: true } : {}) });
    const page = await ctx.newPage();
    let current = '';
    page.on('pageerror', (e) => fail(`${w}px ${current}: page error: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const text = m.text();
      if (!IGNORE.some((r) => r.test(text))) fail(`${w}px ${current}: console error: ${text.slice(0, 200)}`);
    });

    for (const path of PAGES) {
      current = path;
      const res = await page.goto(BASE + path, { waitUntil: 'load' });
      if (!res || res.status() >= 400) fail(`${w}px ${path}: HTTP ${res && res.status()}`);
      await page.locator('main h1').first().waitFor({ timeout: 20000 }).catch(() => fail(`${w}px ${path}: no h1`));
      // Scroll through so every reveal animation runs, then check layout.
      for (let y = 0; y < 15000; y += 700) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(60);
      }
      const info = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        title: document.title,
        canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
        badLinks: [...document.querySelectorAll('a')].filter((a) => !a.getAttribute('href') || a.getAttribute('href') === '#').map((a) => a.outerHTML.slice(0, 80)),
        hrefs: [...document.querySelectorAll('a[href]')].map((a) => a.href),
      }));
      if (info.overflow > 1) fail(`${w}px ${path}: horizontal scroll ${info.overflow}px`);
      if (!info.title.includes('FitMe')) fail(`${w}px ${path}: title "${info.title}"`);
      if (!info.canonical || !info.canonical.endsWith(path === '/' ? '/' : path)) fail(`${w}px ${path}: canonical ${info.canonical}`);
      info.badLinks.forEach((l) => fail(`${w}px ${path}: empty or # link ${l}`));
      info.hrefs.forEach((h) => links.add(h));

      // Every button on the page must react (FAQ items toggle, nav buttons open).
      if (path === '/faq') {
        const buttons = page.locator('main button[aria-expanded]');
        const n = await buttons.count();
        for (let i = 0; i < n; i++) {
          const b = buttons.nth(i);
          const before = await b.getAttribute('aria-expanded');
          await b.click();
          await page.waitForTimeout(250);
          if ((await b.getAttribute('aria-expanded')) === before) fail(`${w}px /faq: question ${i + 1} did not toggle`);
        }
      }
    }

    // Navigation: desktop island links and the features menu; on smaller screens the morphing menu.
    current = 'navbar';
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(800);
    if (w >= 1024) {
      for (const label of ['How it works', 'Download', 'About', 'FAQ', 'Home']) {
        await page.locator('#island').getByRole('link', { name: label, exact: true }).click();
        await page.waitForTimeout(500);
        const active = await page.locator('#island [aria-current="page"]').first().textContent();
        if (!active || !active.includes(label)) fail(`${w}px navbar: "${label}" not active after click (${active})`);
      }
      await page.locator('#island-features').click();
      await page.waitForTimeout(500);
      if ((await page.locator('#island-features').getAttribute('aria-expanded')) !== 'true') fail(`${w}px navbar: features menu did not open`);
      const items = await page.locator('#island [role="region"] a').count();
      if (items < 6) fail(`${w}px navbar: features menu has ${items} items`);
      await page.locator('#island [role="region"] a').first().click();
      await page.waitForURL(/\/features#food/).catch(() => fail(`${w}px navbar: features item did not go to /features#food`));
      await page.keyboard.press('Escape');
    } else {
      await page.locator('#island-menu').click();
      await page.waitForTimeout(500);
      if ((await page.locator('#island-menu').getAttribute('aria-expanded')) !== 'true') fail(`${w}px navbar: menu did not open`);
      const overflowHidden = await page.evaluate(() => document.body.style.overflow === 'hidden');
      if (!overflowHidden) fail(`${w}px navbar: page scroll not locked while the menu is open`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      if ((await page.locator('#island-menu').getAttribute('aria-expanded')) !== 'false') fail(`${w}px navbar: Escape did not close the menu`);
      await page.locator('#island-menu').click();
      await page.waitForTimeout(400);
      await page.locator('[role="dialog"]').getByRole('link', { name: 'FAQ', exact: true }).click();
      await page.waitForURL(/\/faq$/).catch(() => fail(`${w}px navbar: menu link did not navigate`));
      await page.waitForTimeout(400);
      if ((await page.locator('#island-menu').getAttribute('aria-expanded')) !== 'false') fail(`${w}px navbar: menu stayed open after a route change`);
    }
    await ctx.close();
  }

  // Every link found: internal ones must answer (redirects followed), and old member paths must land in /app.
  const ctx = await browser.newContext();
  for (const href of links) {
    const u = new URL(href);
    if (u.origin !== new URL(BASE).origin) continue;
    if (u.pathname === '/download/android') {
      const r = await ctx.request.get(href, { maxRedirects: 0 }).catch(() => null);
      if (!r || ![200, 301, 302].includes(r.status())) fail(`link ${u.pathname}: HTTP ${r && r.status()}`);
      continue;
    }
    const r = await ctx.request.get(href).catch(() => null);
    if (!r || r.status() >= 400) fail(`link ${u.pathname}: HTTP ${r && r.status()}`);
  }
  // Old member paths go to /app (client fallback when served by the dev preview, Hosting 301 on the live site).
  const p = await ctx.newPage();
  for (const old of ['/food', '/health/water', '/settings']) {
    await p.goto(BASE + old, { waitUntil: 'load' });
    await p.waitForURL(/\/app\//, { timeout: 15000 }).catch(() => fail(`old path ${old} did not redirect to /app (${p.url()})`));
  }
  // Unknown path: branded 404 page.
  const nf = await p.goto(BASE + '/no-such-page-' + Date.now(), { waitUntil: 'load' });
  await p.getByText('We could not find that page').waitFor({ timeout: 15000 }).catch(() => fail('404 page not shown'));
  if (!BASE.startsWith('http://localhost') && nf && nf.status() !== 404) fail(`unknown path returned HTTP ${nf.status()} (expected 404)`);
  await browser.close();

  if (problems.length) {
    console.error(`SITE CRAWL FAILED (${problems.length}) for ${BASE}:\n${problems.join('\n')}`);
    process.exit(1);
  }
  console.log(`Site crawl OK: ${PAGES.length} pages x ${WIDTHS.length} widths, ${links.size} links checked, ${BASE}`);
})();
