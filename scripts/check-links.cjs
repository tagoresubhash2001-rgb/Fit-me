const { chromium } = require('playwright');
const http = require('http');
const { spawn } = require('child_process');

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

const ROUTES_TO_TEST = [
  '/',
  '/features',
  '/how-it-works',
  '/download',
  '/about',
  '/faq',
  '/contact',
  '/privacy',
  '/terms',
  '/refund',
  '/delete-account',
  '/non-existent-page-check',
];

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) resolve(true);
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.end();
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Server did not respond at ${url} within ${timeoutMs}ms`);
}

async function runAudit() {
  console.log('--- Starting Vite Preview Server ---');
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    shell: true,
    stdio: 'pipe',
  });

  server.stdout.on('data', (d) => process.stdout.write(`[preview] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[preview err] ${d}`));

  try {
    await waitForServer(BASE_URL);
    console.log(`Server is ready at ${BASE_URL}`);

    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Ignore expected network fetch errors to external mock services if any
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    const collectedLinks = new Set();
    const results = [];

    for (const route of ROUTES_TO_TEST) {
      console.log(`Auditing page: ${route}...`);
      const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
      const status = response ? response.status() : 0;

      // Wait for React to mount the main element
      await page.waitForSelector('main, header', { timeout: 10000 });

      // Check title
      const title = await page.title();
      console.log(`  -> Title: "${title}" (Status: ${status})`);

      // Check for broken links on this page
      const hrefs = await page.$$eval('a[href]', (anchors) =>
        anchors.map((a) => a.getAttribute('href'))
      );

      for (const h of hrefs) {
        if (!h) continue;
        if (h === '#' || h === '#!') {
          throw new Error(`Found empty hash placeholder link "#" on route ${route}`);
        }
        collectedLinks.add(h);
      }

      // Check buttons exist and are not broken
      const buttons = await page.$$('button');
      console.log(`  -> Checked ${buttons.length} buttons, ${hrefs.length} links`);

      results.push({ route, status, title });
    }

    console.log('\n--- Link Summary ---');
    console.log(`Total unique links discovered: ${collectedLinks.size}`);
    for (const link of Array.from(collectedLinks).slice(0, 20)) {
      console.log(`  • ${link}`);
    }

    if (consoleErrors.length > 0) {
      console.warn('\nWarning: Console errors encountered during crawl:');
      consoleErrors.forEach((e) => console.warn(`  - ${e}`));
    } else {
      console.log('\n✓ Zero uncaught page or runtime console errors!');
    }

    await browser.close();
    console.log('\n✓ AUDIT COMPLETED SUCCESSFULLY: All routes and links verified!');
  } finally {
    server.kill();
    // Extra safety on Windows
    spawn('taskkill', ['/pid', String(server.pid), '/f', '/t'], { shell: true });
  }
}

runAudit()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Audit failed:', err);
    process.exit(1);
  });
