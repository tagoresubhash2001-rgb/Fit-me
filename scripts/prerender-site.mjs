#!/usr/bin/env node
/**
 * After `vite build`: one HTML file per website page with its own title, description, canonical, Open Graph and
 * Twitter tags (crawlers and link previews read these without running JavaScript), a noindex 404.html that
 * Firebase Hosting serves with HTTP 404 for unknown paths, and the sitemap. The React app is the same bundle;
 * it takes over on load. Page list: src/features/website/meta.ts (SITE_PAGES), copy: src/locales/site.en.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ORIGIN = 'https://fit-me1.web.app';
const site = JSON.parse(readFileSync(join(root, 'src/locales/site.en.json'), 'utf8')).site;
const metaSrc = readFileSync(join(root, 'src/features/website/meta.ts'), 'utf8');
const pages = [...metaSrc.matchAll(/\{\s*path:\s*'([^']+)',\s*key:\s*'([^']+)'\s*\}/g)].map((m) => ({ path: m[1], key: m[2] }));
if (pages.length < 10) throw new Error(`prerender: expected the website pages in meta.ts, found ${pages.length}`);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const template = readFileSync(join(dist, 'index.html'), 'utf8');

function render({ title, description, path, noindex }) {
  let html = template;
  const url = path ? `${ORIGIN}${path}` : null;
  const set = (re, value) => {
    if (!re.test(html)) throw new Error(`prerender: tag not found ${re}`);
    html = html.replace(re, value);
  };
  set(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  set(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(description)}" />`);
  set(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(title)}" />`);
  set(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(description)}" />`);
  set(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(title)}" />`);
  set(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(description)}" />`);
  if (url) {
    set(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
    set(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  } else {
    html = html.replace(/\s*<link rel="canonical" href="[^"]*" \/>/, '').replace(/\s*<meta property="og:url" content="[^"]*" \/>/, '');
  }
  html = html.replace('</head>', `    <meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow'}" />\n  </head>`);
  return html;
}

for (const p of pages) {
  const m = site.meta[p.key];
  if (!m) throw new Error(`prerender: no site.meta.${p.key}`);
  const file = p.path === '/' ? 'index.html' : `${p.path.slice(1)}.html`;
  writeFileSync(join(dist, file), render({ title: m.title, description: m.description, path: p.path }));
}
// Shell for the member app and the admin area (/app/**, /admin/**): never indexed.
writeFileSync(join(dist, 'app-shell.html'), render({ title: site.tagline, description: site.meta.home.description, path: null, noindex: true }));
writeFileSync(join(dist, '404.html'), render({ title: site.meta.notFound.title, description: site.meta.notFound.description, path: null, noindex: true }));

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${ORIGIN}${p.path === '/' ? '/' : p.path}</loc><lastmod>${today}</lastmod><priority>${p.path === '/' ? '1.0' : p.key === 'download' || p.key === 'features' ? '0.9' : '0.6'}</priority></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(dist, 'sitemap.xml'), sitemap);
console.log(`prerender: ${pages.length} pages, app-shell.html, 404.html, sitemap.xml`);
