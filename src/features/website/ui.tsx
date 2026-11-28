import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LazyMotion, MotionConfig, animate, m, useInView, useReducedMotion } from 'motion/react';
import { Apple, Globe, Smartphone } from 'lucide-react';
import { cn } from '../../components/ui/cn';

/** Motion features load in their own chunk (layout animations need domMax). */
const loadFeatures = () => import('motion/react').then((mod) => mod.domMax);

/** Wraps the website: lazy motion features, and the visitor's reduced-motion setting is respected everywhere. */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

export const spring = { type: 'spring', stiffness: 380, damping: 32, mass: 0.9 } as const;
export const softSpring = { type: 'spring', stiffness: 160, damping: 24 } as const;

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({ children, delay = 0, className, as = 'div' }: { children: React.ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'section' }) {
  const Comp = as === 'li' ? m.li : as === 'section' ? m.section : m.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ ...softSpring, delay }}
    >
      {children}
    </Comp>
  );
}

/** Counts up to a real number when it scrolls into view (shows the final number with reduced motion). */
export function Counter({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setShown(value);
      return;
    }
    const controls = animate(0, value, { duration: 1.1, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [inView, reduce, value]);
  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {shown}
    </span>
  );
}

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

export function SectionHeading({ title, subtitle, center = true, id }: { title: string; subtitle?: string; center?: boolean; id?: string }) {
  return (
    <Reveal className={cn('mb-10 flex flex-col gap-3', center && 'items-center text-center')}>
      <h2 id={id} className="max-w-3xl text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="max-w-2xl text-pretty text-body text-muted sm:text-lg">{subtitle}</p>}
    </Reveal>
  );
}

const btn = {
  base: 'site-press inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-body font-semibold transition-[transform,box-shadow,background-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
  primary: 'bg-primary text-on-primary shadow-float hover:bg-primary-pressed',
  dark: 'bg-island text-island-ink shadow-float ring-1 ring-white/20 hover:opacity-90',
  ghost: 'glass-chip text-ink hover:bg-surface',
};

type BtnProps = { to: string; variant?: 'primary' | 'dark' | 'ghost'; icon?: React.ReactNode; children: React.ReactNode; className?: string; id?: string; external?: boolean; download?: boolean };

/** Website button. Paths outside the website router (/app, /download/android) are full page loads. */
export function SiteButton({ to, variant = 'primary', icon, children, className, id, external, download }: BtnProps) {
  const cls = cn(btn.base, btn[variant], className);
  const fullLoad = external || download || to.startsWith('/app') || to.startsWith('/download/android') || /^https?:/.test(to);
  if (fullLoad)
    return (
      <a id={id} href={to} className={cls} {...(/^https?:/.test(to) ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...(download ? { download: '' } : {})}>
        {icon}
        {children}
      </a>
    );
  return (
    <Link id={id} to={to} className={cls}>
      {icon}
      {children}
    </Link>
  );
}

/** The three ways in: Android download, iPhone, browser. */
export function CtaGroup({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { t } = useTranslation();
  const icon = 'h-5 w-5';
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap', compact && 'sm:justify-center', className)}>
      <SiteButton id="cta-android" to="/download#android" icon={<Smartphone className={icon} strokeWidth={1.9} aria-hidden />}>
        {t('site.cta.android')}
      </SiteButton>
      <SiteButton id="cta-iphone" to="/download#ios" variant="dark" icon={<Apple className={icon} strokeWidth={1.9} aria-hidden />}>
        {t('site.cta.iphone')}
      </SiteButton>
      <SiteButton id="cta-browser" to="/app/" variant="ghost" icon={<Globe className={icon} strokeWidth={1.9} aria-hidden />}>
        {t('site.cta.browser')}
      </SiteButton>
    </div>
  );
}

export const SHOTS = ['home', 'food', 'activity', 'workouts', 'coach', 'insights'] as const;
export type Shot = (typeof SHOTS)[number];

/**
 * A real app screen in a CSS phone frame. Images: /screenshots/app/<shot>.avif|webp at 1x (390 px) and 2x,
 * generated from the demo account by scripts/capture-site-shots.cjs.
 */
export function PhoneFrame({ shot, alt, priority = false, className }: { shot: Shot; alt: string; priority?: boolean; className?: string }) {
  const src = (ext: string) => `/screenshots/app/${shot}.${ext} 1x, /screenshots/app/${shot}@2x.${ext} 2x`;
  return (
    <div className={cn('phone-frame relative aspect-[9/19.5] w-full', className)}>
      <picture>
        <source type="image/avif" srcSet={src('avif')} />
        <source type="image/webp" srcSet={src('webp')} />
        <img
          src={`/screenshots/app/${shot}.webp`}
          alt={alt}
          width={390}
          height={845}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...(priority ? { fetchpriority: 'high' } : {})}
          className="h-full w-full rounded-phone-screen object-cover object-top"
        />
      </picture>
    </div>
  );
}

/** Small frosted card with one metric, floating next to the hero phones. Example values from the demo screens. */
export function GlassMetric({ icon, label, value, tone, className, delay = 0 }: { icon: React.ReactNode; label: string; value: string; tone: 'steps' | 'water' | 'protein' | 'sleep'; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const toneCls = { steps: 'text-steps', water: 'text-water', protein: 'text-protein', sleep: 'text-sleep' }[tone];
  return (
    <m.div
      aria-hidden
      className={cn('glass-card absolute flex items-center gap-2.5 rounded-2xl px-3 py-2.5', className)}
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={reduce ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1, y: [0, -6, 0] }}
      transition={reduce ? { duration: 0 } : { opacity: { delay, duration: 0.4 }, scale: { delay, ...spring }, y: { delay: delay + 0.4, duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
    >
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-surface', toneCls)}>{icon}</span>
      <span className="flex flex-col leading-tight">
        <span className="text-caption text-muted">{label}</span>
        <span className="text-body font-bold text-ink tabular-nums">{value}</span>
      </span>
    </m.div>
  );
}
