import React from 'react';
import { useTranslation } from 'react-i18next';
import { WebsiteLayout } from './WebsiteLayout';
import { Container, Reveal } from './ui';
import { list } from './i18n';

type Section = { h: string; p: string[] };

/** Privacy, terms and refund pages: copy in site.legal.<doc> (title, intro, sections[]). */
export function LegalPage({ doc, metaKey, path, children }: { doc: string; metaKey: string; path: string; children?: React.ReactNode }) {
  const { t } = useTranslation();
  const sections = list<Section>(t, `site.legal.${doc}.sections`);
  return (
    <WebsiteLayout metaKey={metaKey} path={path}>
      <section className="site-mesh -mt-20 pt-32 pb-8 sm:-mt-24 sm:pt-40">
        <Container className="flex max-w-3xl flex-col gap-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{t(`site.legal.${doc}.title`)}</h1>
          <p className="text-small text-muted">{t('site.legal.updated', { date: t('site.legal.updatedDate') })}</p>
          <p className="text-lg text-muted">{t(`site.legal.${doc}.intro`)}</p>
        </Container>
      </section>
      <Container className="flex max-w-3xl flex-col gap-4 py-8">
        {sections.map((s, i) => (
          <Reveal as="section" key={s.h} delay={Math.min(i, 4) * 0.04} className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8">
            <h2 className="mb-3 text-xl font-bold tracking-tight text-ink">{s.h}</h2>
            <div className="flex flex-col gap-3 text-body text-muted">
              {s.p.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>
        ))}
        {children}
      </Container>
    </WebsiteLayout>
  );
}
