import { useEffect } from 'react';

export const SITE_ORIGIN = 'https://fit-me1.web.app';

/** Website pages and their copy key (site.meta.<key>). Also used by scripts/prerender-site.mjs and the sitemap. */
export const SITE_PAGES = [
  { path: '/', key: 'home' },
  { path: '/features', key: 'features' },
  { path: '/how-it-works', key: 'howItWorks' },
  { path: '/download', key: 'download' },
  { path: '/about', key: 'about' },
  { path: '/faq', key: 'faq' },
  { path: '/contact', key: 'contact' },
  { path: '/privacy', key: 'privacy' },
  { path: '/terms', key: 'terms' },
  { path: '/refund', key: 'refund' },
  { path: '/delete-account', key: 'deleteAccount' },
] as const;

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/** Title, description, canonical, Open Graph and Twitter tags for a website page. */
export function usePageMeta(title: string, description: string, path: string | null, noindex = false) {
  useEffect(() => {
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow');
    if (path !== null) {
      const url = `${SITE_ORIGIN}${path}`;
      setCanonical(url);
      setMeta('property', 'og:url', url);
    }
  }, [title, description, path, noindex]);
}
