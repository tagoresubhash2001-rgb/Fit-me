/** GPS route tracking on mobile web with a simulated walk (emulators, or a live URL). */
const { chromium, devices } = require('playwright');
const assert = require('assert');
const { signUp, onboard, tap } = require('./helpers.cjs');
const BASE = process.argv[2] || 'http://127.0.0.1:5173';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['Pixel 7'], permissions: ['geolocation'], geolocation: { latitude: 17.385, longitude: 78.4867, accuracy: 8 } });
  const p = await ctx.newPage();
  await signUp(p, BASE, process.argv[3] || `fitme-gps-${Date.now()}@example.test`, 'Walker');
  await onboard(p);
  await p.locator('#card-calories').waitFor({ timeout: 30000 });
  await p.goto(`${BASE}/workouts`, { waitUntil: 'domcontentloaded' });
  await tap(p, p.locator('#open-route'));
  await tap(p, p.locator('#route-start'));
  // Walk about 60 m north-east in 12 steps, one fix every 1.5 s (walking pace).
  for (let i = 1; i <= 12; i++) {
    await ctx.setGeolocation({ latitude: 17.385 + i * 0.00004, longitude: 78.4867 + i * 0.00002, accuracy: 6 });
    await p.waitForTimeout(1500);
  }
  const km = Number((await p.locator('#route-km').innerText()).replace(',', '.'));
  assert(km > 0.03, `distance did not grow (${km} km)`);
  console.log(`GPS route on mobile web: ${km} km tracked from 12 simulated fixes`);
  await tap(p, p.locator('#route-finish'));
  await p.getByText(/Saved/).first().waitFor({ timeout: 15000 });
  console.log('route saved to workouts');
  await b.close();
})().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
