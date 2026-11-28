import React from 'react';
import { useTranslation } from 'react-i18next';
import { Feather, Globe2, HeartPulse, Lock } from 'lucide-react';
import { WebsiteLayout } from '../WebsiteLayout';
import { Container, Reveal } from '../ui';
import { list } from '../i18n';
import { FinalCta } from './HomePage';

const VALUES = [
  { id: 'simple', icon: Feather },
  { id: 'private', icon: Lock },
  { id: 'local', icon: Globe2 },
  { id: 'safe', icon: HeartPulse },
] as const;

export function AboutPage() {
  const { t } = useTranslation();
  return (
    <WebsiteLayout metaKey="about" path="/about">
      <section className="site-mesh -mt-20 pt-32 pb-12 sm:-mt-24 sm:pt-40">
        <Container className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{t('site.about.title')}</h1>
          <p className="max-w-2xl text-balance text-xl text-muted">{t('site.about.lead')}</p>
        </Container>
      </section>
      <Container className="grid gap-12 py-12 lg:grid-cols-[1.2fr_1fr]">
        <Reveal className="flex flex-col gap-5 text-lg text-ink">
          {list<string>(t, 'site.about.paragraphs').map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Reveal>
        <div>
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-ink">{t('site.about.valuesTitle')}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <Reveal as="li" key={v.id} delay={i * 0.06} className="flex flex-col gap-2 rounded-3xl border border-line bg-surface p-5 shadow-soft">
                <v.icon className="h-6 w-6 text-brand" strokeWidth={1.9} aria-hidden />
                <h3 className="text-body font-bold text-ink">{t(`site.about.values.${v.id}.title`)}</h3>
                <p className="text-small text-muted">{t(`site.about.values.${v.id}.body`)}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </Container>
      <FinalCta />
    </WebsiteLayout>
  );
}
