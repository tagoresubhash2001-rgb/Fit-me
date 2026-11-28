import React from 'react';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import { WebsiteLayout } from '../WebsiteLayout';
import { Container, SiteButton } from '../ui';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <WebsiteLayout metaKey="notFound" path={null} noindex>
      <section className="site-mesh -mt-20 flex min-h-[70dvh] items-center pt-28 sm:-mt-24">
        <Container className="flex flex-col items-center gap-5 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-surface text-brand shadow-soft">
            <Compass className="h-10 w-10" strokeWidth={1.6} aria-hidden />
          </span>
          <p className="text-small font-semibold tracking-wide text-primary-text">404</p>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-ink">{t('site.notFound.title')}</h1>
          <p className="text-lg text-muted">{t('site.notFound.body')}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SiteButton to="/" id="notfound-home">
              {t('site.notFound.home')}
            </SiteButton>
            <SiteButton to="/app/" variant="ghost">
              {t('site.notFound.app')}
            </SiteButton>
          </div>
        </Container>
      </section>
    </WebsiteLayout>
  );
}
