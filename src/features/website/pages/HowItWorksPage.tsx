import React from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, LineChart, PencilLine, UserRound } from 'lucide-react';
import { WebsiteLayout } from '../WebsiteLayout';
import { Container, PhoneFrame, Reveal, type Shot } from '../ui';
import { list } from '../i18n';
import { FinalCta } from './HomePage';

const ICONS = [UserRound, PencilLine, LineChart];
const SHOTS: Shot[] = ['home', 'food', 'insights'];

export function HowItWorksPage() {
  const { t } = useTranslation();
  const steps = list<{ title: string; body: string }>(t, 'site.how.steps');
  return (
    <WebsiteLayout metaKey="howItWorks" path="/how-it-works">
      <section className="site-mesh -mt-20 pt-32 pb-12 sm:-mt-24 sm:pt-40">
        <Container className="flex flex-col items-center gap-4 text-center">
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{t('site.how.title')}</h1>
          <p className="max-w-2xl text-lg text-muted">{t('site.how.subtitle')}</p>
        </Container>
      </section>
      <Container className="py-12">
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = ICONS[i] ?? LineChart;
            return (
              <Reveal as="li" key={s.title} delay={i * 0.08} className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-6 shadow-soft">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-on-primary tabular-nums">{i + 1}</span>
                  <Icon className="h-6 w-6 text-brand" strokeWidth={1.9} aria-hidden />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-ink">{s.title}</h2>
                <p className="text-body text-muted">{s.body}</p>
                <div className="mt-auto pt-2">
                  <PhoneFrame shot={SHOTS[i] ?? 'home'} alt={s.title} className="mx-auto max-w-48" />
                </div>
              </Reveal>
            );
          })}
        </ol>
        <Reveal className="glass-card mt-12 flex flex-col items-start gap-4 rounded-3xl p-8 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-subtle text-primary-text">
            <Cloud className="h-6 w-6" strokeWidth={1.9} aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink">{t('site.how.syncTitle')}</h2>
            <p className="mt-1 text-body text-muted">{t('site.how.syncBody')}</p>
          </div>
        </Reveal>
      </Container>
      <FinalCta />
    </WebsiteLayout>
  );
}
