import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container } from './ui';

const COLS = [
  { title: 'product', links: [['/features', 'site.nav.features'], ['/how-it-works', 'site.nav.howItWorks'], ['/download', 'site.nav.download'], ['/app/', 'site.footer.webApp']] },
  { title: 'company', links: [['/about', 'site.nav.about'], ['/faq', 'site.nav.faq'], ['/contact', 'site.nav.contact']] },
  { title: 'legal', links: [['/privacy', 'site.footer.privacy'], ['/terms', 'site.footer.terms'], ['/refund', 'site.footer.refund'], ['/delete-account', 'site.footer.deleteAccount']] },
] as const;

export function WebsiteFooter() {
  const { t } = useTranslation();
  const linkCls = 'inline-flex min-h-10 items-center text-small text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-brand rounded';
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-3">
          <Link to="/" className="flex items-center gap-2 self-start rounded focus-visible:outline-2 focus-visible:outline-brand">
            <img src="/favicon.svg" alt="" width={36} height={36} className="h-9 w-9 rounded-[11px]" />
            <span className="text-xl font-bold tracking-tight text-ink">FitMe</span>
          </Link>
          <p className="text-small text-muted">{t('site.tagline')}</p>
          <p className="max-w-xs text-caption text-muted">{t('site.footer.disclaimer')}</p>
        </div>
        {COLS.map((col) => (
          <nav key={col.title} aria-label={t(`site.footer.${col.title}`)}>
            <h2 className="mb-2 text-small font-semibold text-ink">{t(`site.footer.${col.title}`)}</h2>
            <ul className="flex flex-col">
              {col.links.map(([to, key]) => (
                <li key={to}>
                  {to.startsWith('/app') ? (
                    <a href={to} className={linkCls}>
                      {t(key)}
                    </a>
                  ) : (
                    <Link to={to} className={linkCls}>
                      {t(key)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-line">
        <Container className="flex flex-col gap-1 py-5 text-caption text-muted sm:flex-row sm:justify-between">
          <span>{t('site.footer.rights', { year: new Date().getFullYear() })}</span>
          <span>{t('site.tagline')}</span>
        </Container>
      </div>
    </footer>
  );
}
