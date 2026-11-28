import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, LayoutGroup, m, useReducedMotion } from 'motion/react';
import { Activity, ChevronDown, Dumbbell, Droplets, Menu, MessageCircleHeart, Salad, X } from 'lucide-react';
import { cn } from '../../components/ui/cn';
import { CtaGroup, spring } from './ui';

type LinkDef = { to: string; key: string; end?: boolean };
const LINKS: LinkDef[] = [
  { to: '/', key: 'home', end: true },
  { to: '/features', key: 'features' },
  { to: '/how-it-works', key: 'howItWorks' },
  { to: '/download', key: 'download' },
  { to: '/about', key: 'about' },
  { to: '/faq', key: 'faq' },
];
const FEATURE_ITEMS = [
  { id: 'food', icon: Salad },
  { id: 'activity', icon: Activity },
  { id: 'workouts', icon: Dumbbell },
  { id: 'coach', icon: MessageCircleHeart },
  { id: 'wellness', icon: Droplets },
] as const;

/** Scroll direction: compact while scrolling down past the top, expanded when scrolling up or at the top. */
function useCompactOnScroll() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 80) setCompact(false);
        else if (y > last + 6) setCompact(true);
        else if (y < last - 6) setCompact(false);
        last = y;
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return compact;
}

function useIsDesktop() {
  const q = '(min-width: 1024px)';
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setDesktop(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return desktop;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Logo({ label }: { label: string }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2 rounded-full py-1 pr-2 pl-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" aria-label={label}>
      <img src="/favicon.svg" alt="" width={32} height={32} className="h-8 w-8 rounded-[10px]" />
      <span className="text-[17px] font-bold tracking-tight text-island-ink">FitMe</span>
    </Link>
  );
}

/**
 * Website navigation: a graphite "Dynamic Island" pill. It mounts compact (logo + FitMe) and springs open into
 * the full navigation; scrolling down shrinks it to a pill with "Get the app", scrolling up expands it again.
 * The Features menu grows out of the island itself. On phones the island morphs into a panel with every link
 * and the three ways in. All size changes are motion layout animations (width, height and radius).
 */
export function DynamicIslandNavbar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const desktop = useIsDesktop();
  const scrolledCompact = useCompactOnScroll();
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const islandRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const panelId = useId();
  const featuresId = useId();

  // Spring open shortly after the first paint (instant with reduced motion).
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), reduce ? 0 : 350);
    return () => window.clearTimeout(id);
  }, [reduce]);

  // Route change closes everything.
  useEffect(() => {
    setFeaturesOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const close = useCallback(() => {
    setFeaturesOpen(false);
    setMenuOpen((open) => {
      if (open) requestAnimationFrame(() => menuButtonRef.current?.focus());
      return false;
    });
  }, []);

  // Escape and outside taps close the features menu and the mobile panel.
  useEffect(() => {
    if (!featuresOpen && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    const onDown = (e: PointerEvent) => {
      if (islandRef.current && !islandRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [featuresOpen, menuOpen, close]);

  // Mobile panel: lock page scroll and keep focus inside the island.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = islandRef.current?.querySelector<HTMLElement>(`#${CSS.escape(panelId)} ${FOCUSABLE}`);
    first?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !islandRef.current) return;
      const items = [...islandRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const a = items[0];
      const z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', trap);
    };
  }, [menuOpen, panelId]);

  useEffect(() => {
    if (desktop) setMenuOpen(false);
    else setFeaturesOpen(false);
  }, [desktop]);

  const compact = !mounted || (scrolledCompact && !featuresOpen && !menuOpen);
  const featuresActive = pathname.startsWith('/features');
  const openedAt = useRef(0);
  const openFeatures = () => {
    window.clearTimeout(closeTimer.current);
    setFeaturesOpen((o) => {
      if (!o) openedAt.current = Date.now();
      return true;
    });
  };
  // A click right after hover opened the menu keeps it open (no open-then-close flicker).
  const clickFeatures = () => {
    if (featuresOpen && Date.now() - openedAt.current < 400) return;
    if (featuresOpen) setFeaturesOpen(false);
    else openFeatures();
  };
  const leaveFeatures = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setFeaturesOpen(false), 220);
  };

  const linkCls = (active: boolean) =>
    cn(
      'relative z-0 flex min-h-10 items-center gap-1 rounded-full px-3.5 text-[14px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
      active ? 'text-island-ink' : 'text-island-muted hover:text-island-ink',
    );
  const ActivePill = () => <m.span layoutId="island-active" className="absolute inset-0 -z-10 rounded-full bg-white/12" transition={spring} />;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[max(12px,env(safe-area-inset-top))]">
      {menuOpen && <div className="pointer-events-auto fixed inset-0 -z-10 bg-scrim" aria-hidden onClick={close} />}
      <LayoutGroup>
        <m.nav
          ref={islandRef}
          layout
          aria-label={t('site.nav.label')}
          transition={spring}
          style={{ borderRadius: menuOpen || featuresOpen ? 28 : 999 }}
          onPointerLeave={desktop && featuresOpen ? leaveFeatures : undefined}
          onPointerEnter={desktop && featuresOpen ? openFeatures : undefined}
          className={cn(
            'pointer-events-auto relative overflow-hidden bg-island text-island-ink shadow-float ring-1 ring-white/8',
            menuOpen ? 'w-full max-w-lg' : 'max-w-full',
          )}
          id="island"
          data-state={menuOpen ? 'menu' : featuresOpen ? 'features' : compact ? 'compact' : 'expanded'}
        >
          <m.div layout="position" className="flex items-center gap-1 py-1.5 pr-1.5 pl-2">
            <Logo label={t('site.brand')} />

            {/* Desktop links (expanded) */}
            <AnimatePresence initial={false} mode="popLayout">
              {desktop && !compact && (
                <m.ul key="links" className="flex items-center gap-0.5 px-2" initial={{ opacity: 0, filter: 'blur(4px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, filter: 'blur(4px)' }} transition={{ duration: 0.18 }}>
                  {LINKS.map((l) =>
                    l.key === 'features' ? (
                      <li key={l.key} onPointerEnter={openFeatures}>
                        <button
                          type="button"
                          id="island-features"
                          aria-expanded={featuresOpen}
                          aria-controls={featuresId}
                          onClick={clickFeatures}
                          className={linkCls(featuresActive || featuresOpen)}
                          aria-current={featuresActive ? 'page' : undefined}
                        >
                          {featuresActive && <ActivePill />}
                          {t('site.nav.features')}
                          <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', featuresOpen && 'rotate-180')} strokeWidth={2} aria-hidden />
                        </button>
                      </li>
                    ) : (
                      <li key={l.key}>
                        <NavLink to={l.to} end={l.end} className={({ isActive }) => linkCls(isActive)}>
                          {({ isActive }) => (
                            <>
                              {isActive && <ActivePill />}
                              {t(`site.nav.${l.key}`)}
                            </>
                          )}
                        </NavLink>
                      </li>
                    ),
                  )}
                </m.ul>
              )}
            </AnimatePresence>

            {/* Right side: "Get the app" pill (desktop and compact) or the menu button (phones and tablets) */}
            <m.div layout="position" className="ml-auto flex items-center gap-1 pl-2">
              {(desktop || compact) && !menuOpen && (
                <Link
                  to="/download"
                  id="island-get-app"
                  className="site-press inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-[14px] font-semibold whitespace-nowrap text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {t('site.nav.getApp')}
                </Link>
              )}
              {!desktop && (
                <button
                  ref={menuButtonRef}
                  type="button"
                  id="island-menu"
                  aria-expanded={menuOpen}
                  aria-controls={panelId}
                  aria-label={menuOpen ? t('site.nav.closeMenu') : t('site.nav.openMenu')}
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-island-ink transition-colors hover:bg-white/16 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {menuOpen ? <X className="h-5 w-5" strokeWidth={2} aria-hidden /> : <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />}
                </button>
              )}
            </m.div>
          </m.div>

          {/* Features menu, grown out of the island (desktop) */}
          <AnimatePresence initial={false}>
            {desktop && featuresOpen && (
              <m.div
                key="features"
                id={featuresId}
                role="region"
                aria-label={t('site.nav.featuresMenu')}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={spring}
                className="overflow-hidden"
              >
                <ul className="grid grid-cols-3 gap-1 px-3 pt-1 pb-3">
                  {FEATURE_ITEMS.map(({ id, icon: Icon }) => (
                    <li key={id}>
                      <Link to={`/features#${id}`} className="flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-brand">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/20 text-brand-soft">
                          <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden />
                        </span>
                        <span className="flex flex-col">
                          <span className="text-[14px] font-semibold text-island-ink">{t(`site.nav.items.${id}.title`)}</span>
                          <span className="text-caption text-island-muted">{t(`site.nav.items.${id}.body`)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link to="/features" className="flex h-full items-center justify-center rounded-2xl p-3 text-[14px] font-semibold text-brand-soft hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-brand">
                      {t('site.nav.allFeatures')}
                    </Link>
                  </li>
                </ul>
              </m.div>
            )}
          </AnimatePresence>

          {/* Mobile panel: the island morphs into a rounded panel */}
          <AnimatePresence initial={false}>
            {!desktop && menuOpen && (
              <m.div
                key="panel"
                id={panelId}
                role="dialog"
                aria-modal="true"
                aria-label={t('site.nav.label')}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={spring}
                className="overflow-hidden"
              >
                <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain px-3 pb-4">
                  <ul className="flex flex-col gap-0.5 pt-1">
                    {[...LINKS, { to: '/contact', key: 'contact' }].map((l) => (
                      <li key={l.key}>
                        <NavLink
                          to={l.to}
                          end={(l as LinkDef).end}
                          className={({ isActive }) =>
                            cn('flex min-h-12 items-center rounded-2xl px-4 text-[17px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand', isActive ? 'bg-white/12 text-island-ink' : 'text-island-muted hover:bg-white/8 hover:text-island-ink')
                          }
                        >
                          {t(`site.nav.${l.key}`)}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 border-t border-white/10 pt-4">
                    <CtaGroup className="[&>a]:w-full" />
                  </div>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </m.nav>
      </LayoutGroup>
    </div>
  );
}
