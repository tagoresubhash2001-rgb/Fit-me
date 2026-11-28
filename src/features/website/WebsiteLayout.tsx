import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n';
import { DynamicIslandNavbar } from './DynamicIslandNavbar';
import { WebsiteFooter } from './WebsiteFooter';
import { MotionRoot } from './ui';
import { usePageMeta } from './meta';

interface Props {
  children: React.ReactNode;
  /** site.meta.<metaKey>.title / .description */
  metaKey: string;
  /** Canonical path; null for pages that should not be indexed (404). */
  path: string | null;
  noindex?: boolean;
}

/** Shell of every website page: skip link, island navbar, content and footer, plus the page's meta tags. */
export function WebsiteLayout({ children, metaKey, path, noindex = false }: Props) {
  const { t } = useTranslation();
  const { pathname, hash } = useLocation();
  usePageMeta(t(`site.meta.${metaKey}.title`), t(`site.meta.${metaKey}.description`), path, noindex);

  // New page: start at the top, or at the #section the link points to.
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return (
    <MotionRoot>
      <div className="flex min-h-dvh flex-col overflow-x-clip bg-canvas text-ink antialiased selection:bg-brand selection:text-white">
        <a href="#main" className="sr-only z-[60] rounded-full bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
          {t('site.skip')}
        </a>
        <DynamicIslandNavbar />
        <main id="main" tabIndex={-1} className="flex-1 pt-20 outline-none sm:pt-24">
          {children}
        </main>
        <WebsiteFooter />
      </div>
    </MotionRoot>
  );
}
