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

/**
 * First paint without JavaScript: the page's heading block with the same classes the React page uses (the
 * built CSS already contains them). React replaces it when the page chunk has loaded.
 */
const C = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';
const head = (h1, p, narrow = false) =>
  `<section class="site-mesh -mt-20 pt-32 pb-12 sm:-mt-24 sm:pt-40"><div class="${C} flex ${narrow ? 'max-w-3xl flex-col gap-3' : 'flex-col items-center gap-4 text-center'}"><h1 class="${narrow ? '' : 'max-w-3xl text-balance '}text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">${esc(h1)}</h1><p class="${narrow ? '' : 'max-w-2xl '}text-lg text-muted">${esc(p)}</p></div></section>`;
function staticBody(key) {
  const s = site;
  const cta = (id, label, cls) => `<a id="${id}" href="${id.endsWith('browser') ? '/app/' : `/download#${id.endsWith('android') ? 'android' : 'ios'}`}" class="site-press inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-body font-semibold ${cls}">${esc(label)}</a>`;
  const body = {
    home: `<section aria-labelledby="hero-title" class="site-mesh relative -mt-20 overflow-hidden pt-28 pb-16 sm:-mt-24 sm:pt-36 lg:pb-24"><div class="${C} grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]"><div class="flex flex-col items-start gap-6"><p class="glass-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-small font-medium text-ink">${esc(s.home.badge)}</p><h1 id="hero-title" class="text-balance text-[clamp(2.4rem,6vw,4.25rem)] leading-[1.04] font-extrabold tracking-tight text-ink">${esc(s.home.title)} <span class="bg-gradient-to-r from-brand to-brand-soft bg-clip-text text-transparent">${esc(s.home.titleAccent)}</span></h1><p class="max-w-xl text-pretty text-lg text-muted">${esc(s.home.subtitle)}</p><div class="w-full sm:w-auto"><div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">${cta('cta-android', s.cta.android, 'bg-primary text-on-primary shadow-float')}${cta('cta-iphone', s.cta.iphone, 'bg-island text-island-ink shadow-float ring-1 ring-white/20')}${cta('cta-browser', s.cta.browser, 'glass-chip text-ink')}</div></div></div></div></section>`,
    features: head(s.features.title, s.features.subtitle),
    howItWorks: head(s.how.title, s.how.subtitle),
    download: head(s.download.title, s.download.subtitle),
    about: head(s.about.title, s.about.lead),
    faq: head(s.faq.title, s.faq.subtitle),
    contact: head(s.contact.title, s.contact.subtitle),
    privacy: head(s.legal.privacy.title, s.legal.privacy.intro, true),
    terms: head(s.legal.terms.title, s.legal.terms.intro, true),
    refund: head(s.legal.refund.title, s.legal.refund.intro, true),
    deleteAccount: head(s.legal.delete.title, s.legal.delete.intro, true),
  }[key];
  if (!body) return null;
  return `<div class="flex min-h-dvh flex-col overflow-x-clip bg-canvas text-ink antialiased"><main id="main" class="flex-1 pt-20 outline-none sm:pt-24">${body}</main></div>`;
}

function render({ title, description, path, noindex, key }) {
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
  const body = key ? staticBody(key) : null;
  if (body) {
    const re = /<div class="boot" aria-busy="true">[\s\S]*?<\/div>\s*<\/div>/;
    if (!re.test(html)) throw new Error('prerender: splash markup not found');
    html = html.replace(re, `${body}</div>`);
  }
  html = html.replace('</head>', `    <meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow'}" />\n  </head>`);
  return html;
}

for (const p of pages) {
  const m = site.meta[p.key];
  if (!m) throw new Error(`prerender: no site.meta.${p.key}`);
  const file = p.path === '/' ? 'index.html' : `${p.path.slice(1)}.html`;
  writeFileSync(join(dist, file), render({ title: m.title, description: m.description, path: p.path, key: p.key }));
}
// Shell for the member app and the admin area (/app/**, /admin/**): never indexed.
writeFileSync(join(dist, 'app-shell.html'), render({ title: site.tagline, description: site.meta.home.description, path: null, noindex: true }));
writeFileSync(join(dist, '404.html'), render({ title: site.meta.notFound.title, description: site.meta.notFound.description, path: null, noindex: true, key: 'notFound' }));

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${ORIGIN}${p.path === '/' ? '/' : p.path}</loc><lastmod>${today}</lastmod><priority>${p.path === '/' ? '1.0' : p.key === 'download' || p.key === 'features' ? '0.9' : '0.6'}</priority></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(dist, 'sitemap.xml'), sitemap);
console.log(`prerender: ${pages.length} pages, app-shell.html, 404.html, sitemap.xml`);
