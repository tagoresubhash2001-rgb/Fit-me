import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Droplets, Dumbbell, Footprints, Salad, Sparkles } from 'lucide-react';
import { WebsiteLayout } from '../WebsiteLayout';
import { Container, PhoneFrame, Reveal, type Shot } from '../ui';
import { list } from '../i18n';
import { FinalCta } from './HomePage';
import { cn } from '../../../components/ui/cn';

const SECTIONS: { id: string; icon: typeof Salad; tone: string; shot: Shot }[] = [
  { id: 'food', icon: Salad, tone: 'text-protein', shot: 'food' },
  { id: 'activity', icon: Footprints, tone: 'text-steps', shot: 'activity' },
  { id: 'workouts', icon: Dumbbell, tone: 'text-water', shot: 'workouts' },
  { id: 'coach', icon: Sparkles, tone: 'text-brand', shot: 'coach' },
  { id: 'wellness', icon: Droplets, tone: 'text-sleep', shot: 'insights' },
];

export function FeaturesPage() {
  const { t } = useTranslation();
  return (
    <WebsiteLayout metaKey="features" path="/features">
      <section className="site-mesh -mt-20 pt-32 pb-12 sm:-mt-24 sm:pt-40">
        <Container className="flex flex-col items-center gap-4 text-center">
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{t('site.features.title')}</h1>
          <p className="max-w-2xl text-lg text-muted">{t('site.features.subtitle')}</p>
        </Container>
      </section>
      <Container className="flex flex-col gap-20 py-12">
        {SECTIONS.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="grid scroll-mt-28 items-center gap-10 md:grid-cols-2">
            <Reveal className={cn('flex flex-col gap-4', i % 2 === 1 && 'md:order-2')}>
              <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-surface shadow-soft', s.tone)}>
                <s.icon className="h-6 w-6" strokeWidth={1.9} aria-hidden />
              </span>
              <h2 id={`${s.id}-title`} className="text-3xl font-bold tracking-tight text-ink">
                {t(`site.features.sections.${s.id}.title`)}
              </h2>
              <p className="text-lg text-muted">{t(`site.features.sections.${s.id}.body`)}</p>
              <ul className="mt-2 flex flex-col gap-3">
                {list<string>(t, `site.features.sections.${s.id}.points`).map((p) => (
                  <li key={p} className="flex items-start gap-3 text-body text-ink">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary-text">
                      <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1} className="mx-auto w-full max-w-64">
              <PhoneFrame shot={s.shot} alt={t(`site.features.sections.${s.id}.title`)} />
            </Reveal>
          </section>
        ))}
        <Reveal className="rounded-3xl border border-line bg-surface p-6 text-body text-muted shadow-soft">{t('site.features.plansNote')}</Reveal>
      </Container>
      <FinalCta />
    </WebsiteLayout>
  );
}
