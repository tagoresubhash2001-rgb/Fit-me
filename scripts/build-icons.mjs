// Renders the app icons and the social preview image from public/favicon.svg with the bundled Chromium.
// Usage: node scripts/build-icons.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

// Playwright is pre-installed globally in CI images and dev machines; resolve it like the e2e scripts do.
const { chromium } = createRequire(import.meta.url)('playwright');

const svg = readFileSync('public/favicon.svg', 'utf8');
const glyph = svg.replace(/<rect width="512" height="512" rx="112" fill="#1FA45B"\/>/, '');
const browser = await chromium.launch();
const page = await browser.newPage();

async function render(html, w, h, path, transparent = false) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;background:${transparent ? 'transparent' : '#F7F5EF'}">${html}</body></html>`);
  await page.screenshot({ path, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
  console.log('wrote', path);
}
const sized = (s, size) => s.replace('<svg ', `<svg width="${size}" height="${size}" style="display:block" `);

for (const size of [192, 512]) await render(sized(svg, size), size, size, `public/icons/icon-${size}.png`, true);
// Maskable: full-bleed brand colour, the mark scaled into the 80% safe zone.
for (const size of [192, 512])
  await render(
    `<div style="width:${size}px;height:${size}px;background:#1FA45B;display:flex;align-items:center;justify-content:center">${sized(glyph.replace('viewBox="0 0 512 512"', 'viewBox="40 40 432 432"'), Math.round(size * 0.8))}</div>`,
    size,
    size,
    `public/icons/maskable-${size}.png`,
  );
await render(sized(svg.replace('rx="112"', 'rx="0"'), 180), 180, 180, 'public/icons/apple-touch-icon.png');
await render(sized(svg, 32), 32, 32, 'public/icons/favicon-32.png', true);
await render(
  `<div style="width:1200px;height:630px;background:#F7F5EF;display:flex;align-items:center;gap:56px;padding:0 96px;box-sizing:border-box;font-family:Inter,system-ui,sans-serif">
     ${sized(svg, 220)}
     <div><div style="font-size:84px;font-weight:700;color:#0F1720;letter-spacing:-1px">FIT ME <span style="color:#1FA45B">AI</span></div>
     <div style="font-size:34px;color:#5B616B;margin-top:16px;line-height:1.3">Food, water, sleep, steps and workouts,<br/>with Jai and Jaya, your AI coaches.</div></div>
   </div>`,
  1200,
  630,
  'public/og-image.png',
);
await browser.close();
