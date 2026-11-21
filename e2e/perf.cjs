/**
 * Runtime smoothness on a mid-range Android profile (Pixel 7 viewport, 4x CPU throttle): frame times while
 * scrolling and animating, long tasks, route change times and interaction latency (Event Timing, an INP
 * proxy). Usage: node e2e/perf.cjs <baseUrl> [label]   -> prints JSON and appends to docs/perf-runs.jsonl
 * Creates one test account (remove it with e2e/_cleanup-user.cjs when run against a live site).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { DEVICES, signUp, onboard } = require('./helpers.cjs');

const BASE = process.argv[2] || 'http://127.0.0.1:5173';
const LABEL = process.argv[3] || 'run';

const recorder = () => {
  window.__frames = [];
  window.__long = [];
  window.__events = [];
  let last = performance.now();
  const loop = (t) => {
    window.__frames.push(t - last);
    last = t;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(e.duration))).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver((l) => l.getEntries().forEach((e) => e.interactionId && window.__events.push(e.duration))).observe({ type: 'event', durationThreshold: 16, buffered: true });
  } catch {
    /* unsupported */
  }
};

async function window_(page, fn) {
  await page.evaluate(() => {
    window.__frames = [];
    window.__long = [];
  });
  await fn();
  return page.evaluate(() => {
    const f = window.__frames.slice(1);
    const sorted = [...f].sort((a, b) => a - b);
    const total = f.reduce((a, b) => a + b, 0);
    return {
      fps: Math.round((f.length / total) * 1000 * 10) / 10,
      p95FrameMs: Math.round(sorted[Math.floor(sorted.length * 0.95)] ?? 0),
      droppedPct: Math.round((f.filter((x) => x > 34).length / Math.max(1, f.length)) * 1000) / 10,
      longTasks: window.__long.length,
      longTaskMs: Math.round(window.__long.reduce((a, b) => a + b, 0)),
    };
  });
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...DEVICES['pixel-7'], locale: 'en-IN', timezoneId: 'Asia/Kolkata' });
  await ctx.addInitScript(recorder);
  const page = await ctx.newPage();
  const email = `fitme-perf-${Date.now()}@example.com`;
  await signUp(page, BASE, email);
  await onboard(page);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.waitForTimeout(1500);

  const out = { label: LABEL, base: BASE, at: new Date().toISOString(), device: 'Pixel 7, 4x CPU throttle' };
  out.homeScroll = await window_(page, async () => {
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(60);
    }
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, -120);
      await page.waitForTimeout(60);
    }
  });
  // Route changes through the bottom bar: time from tap to the new screen's heading.
  out.routes = {};
  out.routesRepeat = {};
  for (const key of ['routes', 'routesRepeat'])
  for (const [tab, heading] of [
    ['health', 'Health'],
    ['workouts', 'Workouts'],
    ['planner', 'Planner'],
    ['home', null],
  ]) {
    const t0 = Date.now();
    await page.click(`#nav-${tab}`);
    if (heading) await page.getByRole('heading', { name: heading, level: 1 }).first().waitFor();
    else await page.locator('#card-calories').waitFor();
    out[key][tab] = Date.now() - t0;
  }
  try {
    await page.goto(`${BASE}/plans`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: /Yearly/ }).waitFor();
    await page.waitForTimeout(800);
    out.plansPeriodSwitch = await window_(page, async () => {
      for (const p of [/3 months/, /Yearly/, /Monthly/, /Yearly/]) {
        await page.getByRole('tab', { name: p }).click();
        await page.waitForTimeout(450);
      }
    });
    out.sheetOpenClose = await window_(page, async () => {
      await page.locator('#plan-pro').getByRole('button').last().click();
      await page.getByRole('dialog').waitFor();
      await page.waitForTimeout(400);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    });
  } catch {
    out.plansPeriodSwitch = out.plansPeriodSwitch ?? 'not available in this build';
  }
  out.interactionMaxMs = await page.evaluate(() => Math.round(Math.max(0, ...window.__events)));
  out.account = email;
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
  fs.appendFileSync(path.join(__dirname, '..', 'docs', 'perf-runs.jsonl'), `${JSON.stringify(out)}\n`);
})().catch((e) => {
  console.error('PERF FAILED:', e.message.split('\n')[0]);
  process.exit(1);
});
