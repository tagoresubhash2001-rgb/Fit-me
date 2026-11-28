import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { m } from 'motion/react';
import { Activity, ArrowRight, Droplets, Footprints, Languages, Map, Moon, Salad, ShieldCheck, Sparkles } from 'lucide-react';
import { WebsiteLayout } from '../WebsiteLayout';
import { Container, Counter, CtaGroup, GlassMetric, PhoneFrame, Reveal, SHOTS, SectionHeading, softSpring } from '../ui';
import { Stories } from '../Stories';
import { cn } from '../../../components/ui/cn';

const BENTO = [
  { id: 'food', icon: Salad, tone: 'text-protein', span: 'md:col-span-2 md:row-span-2', shot: 'food' as const },
  { id: 'activity', icon: Footprints, tone: 'text-steps', span: '' },
  { id: 'workouts', icon: Map, tone: 'text-water', span: '' },
  { id: 'coach', icon: Sparkles, tone: 'text-brand', span: 'md:col-span-2' },
  { id: 'wellness', icon: Moon, tone: 'text-sleep', span: '' },
  { id: 'languages', icon: Languages, tone: 'text-calories', span: '' },
] as const;

function Hero() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="hero-title" className="site-mesh relative -mt-20 overflow-hidden pt-28 pb-16 sm:-mt-24 sm:pt-36 lg:pb-24">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col items-start gap-6">
          <m.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={softSpring} className="glass-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-small font-medium text-ink">
            <Activity className="h-4 w-4 text-brand" strokeWidth={2} aria-hidden />
            {t('site.home.badge')}
          </m.p>
          <m.h1
            id="hero-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...softSpring, delay: 0.05 }}
            className="text-balance text-[clamp(2.4rem,6vw,4.25rem)] leading-[1.04] font-extrabold tracking-tight text-ink"
          >
            {t('site.home.title')} <span className="bg-gradient-to-r from-brand to-brand-soft bg-clip-text text-transparent">{t('site.home.titleAccent')}</span>
          </m.h1>
          <m.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.1 }} className="max-w-xl text-pretty text-lg text-muted">
            {t('site.home.subtitle')}
          </m.p>
          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.15 }} className="w-full sm:w-auto">
            <CtaGroup />
          </m.div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none" role="img" aria-label={t('site.home.previewLabel')}>
          <div className="relative mx-auto grid max-w-sm grid-cols-2 items-end gap-4 sm:max-w-md">
            <m.div initial={{ opacity: 0, y: 40, rotate: -4 }} animate={{ opacity: 1, y: 24, rotate: -4 }} transition={{ ...softSpring, delay: 0.2 }}>
              <PhoneFrame shot="food" alt="" />
            </m.div>
            <m.div initial={{ opacity: 0, y: 40, rotate: 3 }} animate={{ opacity: 1, y: 0, rotate: 3 }} transition={{ ...softSpring, delay: 0.3 }}>
              <PhoneFrame shot="home" alt="" priority />
            </m.div>
          </div>
          <GlassMetric icon={<Footprints className="h-5 w-5" strokeWidth={2} />} label={t('site.home.metrics.steps')} value={t('site.home.metricValues.steps')} tone="steps" className="top-[8%] -left-1 sm:-left-6" delay={0.6} />
          <GlassMetric icon={<Droplets className="h-5 w-5" strokeWidth={2} />} label={t('site.home.metrics.water')} value={t('site.home.metricValues.water')} tone="water" className="top-[38%] -right-1 sm:-right-4" delay={0.75} />
          <GlassMetric icon={<Salad className="h-5 w-5" strokeWidth={2} />} label={t('site.home.metrics.protein')} value={t('site.home.metricValues.protein')} tone="protein" className="bottom-[22%] -left-1 sm:-left-8" delay={0.9} />
          <GlassMetric icon={<Moon className="h-5 w-5" strokeWidth={2} />} label={t('site.home.metrics.sleep')} value={t('site.home.metricValues.sleep')} tone="sleep" className="-right-1 bottom-[2%] sm:right-2" delay={1.05} />
        </div>
      </Container>
    </section>
  );
}

function Facts() {
  const { t } = useTranslation();
  const facts = [
    { value: 10, key: 'languages' },
    { value: 5, key: 'areas' },
    { value: 3, key: 'platforms' },
  ];
  return (
    <section aria-labelledby="facts-title" className="py-16">
      <Container>
        <h2 id="facts-title" className="sr-only">
          {t('site.home.factsTitle')}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {facts.map((f, i) => (
            <Reveal as="li" key={f.key} delay={i * 0.08} className="glass-card flex items-center gap-4 rounded-3xl p-6">
              <Counter value={f.value} className="text-5xl font-extrabold tracking-tight text-brand" />
              <span className="text-body text-muted">{t(`site.home.facts.${f.key}`)}</span>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function Bento() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="bento-title" className="py-16">
      <Container>
        <SectionHeading id="bento-title" title={t('site.home.bentoTitle')} subtitle={t('site.home.bentoSubtitle')} />
        <ul className="grid auto-rows-[minmax(12rem,auto)] gap-4 md:grid-cols-4">
          {BENTO.map((b, i) => (
            <Reveal as="li" key={b.id} delay={i * 0.06} className={cn('group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-soft transition-transform duration-300 hover:-translate-y-1', b.span)}>
              <span className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-raised', b.tone)}>
                <b.icon className="h-6 w-6" strokeWidth={1.9} aria-hidden />
              </span>
              <h3 className="text-xl font-bold tracking-tight text-ink">{t(`site.home.bento.${b.id}.title`)}</h3>
              <p className="mt-2 text-body text-muted">{t(`site.home.bento.${b.id}.body`)}</p>
              {'shot' in b && (
                <div className="pointer-events-none mt-6 hidden flex-1 items-end justify-center md:flex">
                  <PhoneFrame shot={b.shot} alt="" className="max-w-56 translate-y-10 transition-transform duration-500 group-hover:translate-y-6" />
                </div>
              )}
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function Screens() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="screens-title" className="py-16">
      <Container>
        <SectionHeading id="screens-title" title={t('site.home.screensTitle')} subtitle={t('site.home.screensSubtitle')} />
      </Container>
      <ul className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 sm:px-6 lg:justify-center lg:px-8" aria-label={t('site.home.screensTitle')}>
        {SHOTS.map((s, i) => (
          <Reveal as="li" key={s} delay={i * 0.05} className="flex w-[min(62vw,15rem)] shrink-0 snap-center flex-col items-center gap-3">
            <PhoneFrame shot={s} alt={t(`site.home.screens.${s}`)} />
            <span className="text-small font-medium text-muted">{t(`site.home.screens.${s}`)}</span>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function Privacy() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="privacy-title" className="py-16">
      <Container>
        <Reveal className="glass-card flex flex-col items-start gap-4 rounded-[2rem] p-8 sm:flex-row sm:items-center sm:p-10">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-subtle text-primary-text">
            <ShieldCheck className="h-7 w-7" strokeWidth={1.9} aria-hidden />
          </span>
          <div className="flex flex-1 flex-col gap-2">
            <h2 id="privacy-title" className="text-2xl font-bold tracking-tight text-ink">
              {t('site.home.privacyTitle')}
            </h2>
            <p className="text-body text-muted">{t('site.home.privacyBody')}</p>
          </div>
          <Link to="/privacy" className="inline-flex min-h-11 items-center gap-1 rounded-full text-body font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-brand">
            {t('site.home.privacyLink')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={2} aria-hidden />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}

export function FinalCta() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="final-title" className="py-16">
      <Container>
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-island px-6 py-14 text-center sm:px-12">
          <div aria-hidden className="absolute inset-0 opacity-70 [background:radial-gradient(50%_60%_at_20%_0%,var(--mesh-1),transparent),radial-gradient(40%_60%_at_90%_100%,var(--mesh-2),transparent)]" />
          <div className="relative flex flex-col items-center gap-4">
            <h2 id="final-title" className="max-w-2xl text-balance text-3xl font-bold tracking-tight text-island-ink sm:text-4xl">
              {t('site.home.finalTitle')}
            </h2>
            <p className="max-w-xl text-body text-island-muted sm:text-lg">{t('site.home.finalBody')}</p>
            <CtaGroup compact className="mt-2 w-full sm:w-auto" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export function HomePage() {
  return (
    <WebsiteLayout metaKey="home" path="/">
      <Hero />
      <Facts />
      <Bento />
      <Screens />
      <Stories />
      <Privacy />
      <FinalCta />
    </WebsiteLayout>
  );
}
