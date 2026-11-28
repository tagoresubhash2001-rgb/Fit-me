import React, { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  CalendarDays,
  HeartPulse,
  Dumbbell,
  ShoppingBag,
  MessageCircle,
  WifiOff,
  CircleArrowUp,
  Settings as SettingsIcon,
  UserRound,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Keyboard,
} from 'lucide-react';
import { Avatar, Sheet, Skeleton, SlidingPill, cn, BrandLogo } from '../components/ui';
import { prefetchRoute, prefetchWhenIdle, type RouteKey } from './routes';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { useSession } from '../data/session';
import { signOut } from '../data/auth';
import { useOnline, useToday } from '../lib/hooks';
import { useIsDesktop } from '../lib/breakpoints';
import { useThemeStore, type VisualTheme } from '../stores/theme.store';
import { useUi } from '../stores/ui.store';
import { CoachDock, CoachSheet } from '../features/coach/CoachSheet';
import { NovaBar } from './NovaBar';
import { StageEndingBanner, TrialEndingBanner } from '../features/plans/PlanPrompts';
import { PromoRibbon } from '../features/home/Banners';
import { InboxButton } from '../features/inbox/InboxButton';
import { useShortcuts, SHORTCUTS } from './shortcuts';
import { useFeatures } from '../data/appConfig';
import { isNative } from '../lib/platform';
import { autoSyncDevices } from '../data/autoSync';

const TABS = [
  { to: '/', key: 'home', icon: Home, end: true },
  { to: '/planner', key: 'planner', icon: CalendarDays },
  { to: '/health', key: 'health', icon: HeartPulse },
  { to: '/workouts', key: 'workouts', icon: Dumbbell },
  { to: '/store', key: 'store', icon: ShoppingBag },
] as const;

/** Navigation tabs, without the ones an admin switched off (Planner, Store). */
function useTabs() {
  const f = useFeatures();
  return TABS.filter((tab) => (tab.key === 'planner' ? f.planner : tab.key === 'store' ? f.store : true));
}

/**
 * App shell: decides the layout for every form factor so screens only describe content.
 * - mobile (< 768) and tablet portrait: floating glass bottom bar
 * - tablet landscape (768-1279, landscape): compact navigation rail
 * - desktop (>= 1280): collapsible glass sidebar, top bar with search, date, theme and avatar menu,
 *   and the coach docked on the right
 */
export function Shell() {
  const { t } = useTranslation();
  const location = useLocation();
  const online = useOnline();
  const desktop = useIsDesktop();
  const features = useFeatures();
  const coachOpen = useUi((s) => s.coachOpen);
  const setCoachOpen = useUi((s) => s.setCoachOpen);
  useShortcuts();
  useEffect(() => {
    prefetchWhenIdle();
  }, []);
  // Phones: bring in the steps counted while FitMe was closed, and health-platform data, each time it opens.
  useEffect(() => {
    if (!isNative() || !features.deviceSync) return;
    const run = () => void autoSyncDevices();
    run();
    const onVisible = () => document.visibilityState === 'visible' && run();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [features.deviceSync]);
  const transition = useRouteTransition(location.pathname, desktop);

  return (
    <div className="relative flex min-h-dvh bg-canvas text-ink">
      <a href="#main" className="sr-only z-[200] rounded-button bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:start-3 focus:top-3">
        {t('shell.skip')}
      </a>
      <Sidebar />
      <Rail />
      <div className="flex min-w-0 flex-1 flex-col land:ps-[88px]">
        <TopBar />
        {!online && (
          <p role="status" className="mx-4 mt-3 flex items-center gap-2 rounded-input bg-accent-subtle px-3 py-2 text-caption text-accent md:mx-6 xl:mx-8">
            <WifiOff className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {t('common.offline')}
          </p>
        )}
        <PromoRibbon />
        <TrialEndingBanner />
        <StageEndingBanner />
        <NovaBar />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-36 outline-none md:max-w-3xl md:px-6 land:max-w-5xl land:pb-10 xl:max-w-[1360px] xl:px-8 xl:pb-12 2xl:max-w-[1440px]">
          <div key={location.pathname.split('/')[1]} className={transition}>
            <RouteErrorBoundary resetKey={location.pathname}>
              <Suspense fallback={<PageSkeleton />}>
                <Outlet />
              </Suspense>
            </RouteErrorBoundary>
          </div>
        </main>
      </div>

      {/* Coach: docked panel on desktop, sheet elsewhere. The same conversation component. */}
      {desktop ? <CoachDock /> : <CoachSheet open={coachOpen} onClose={() => setCoachOpen(false)} />}
      {features.coach && !(desktop && coachOpen) && (
        <button
          id="coach-button"
          type="button"
          onClick={() => setCoachOpen(true)}
          aria-label={t('coach.open')}
          data-tip={t('coach.open')}
          className="fixed end-4 bottom-[calc(max(12px,env(safe-area-inset-bottom))+84px)] z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-float transition-[background-color,transform] duration-150 hover:bg-primary-pressed active:scale-95 land:bottom-6 xl:end-8 xl:bottom-8"
        >
          <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
        </button>
      )}

      <BottomBar />
      <ShortcutsDialog />
    </div>
  );
}

/** Order of the main screens: moving right slides in from the right, moving left from the left (mobile). */
const ROUTE_ORDER = ['', 'food', 'planner', 'health', 'workouts', 'store'];
function useRouteTransition(pathname: string, desktop: boolean) {
  const seg = pathname.split('/')[1] ?? '';
  const last = useRef<{ seg: string; cls: string }>({ seg, cls: 'route-up' });
  if (last.current.seg !== seg) {
    const from = ROUTE_ORDER.indexOf(last.current.seg);
    const to = ROUTE_ORDER.indexOf(seg);
    const cls = desktop || from < 0 || to < 0 ? 'route-up' : to > from ? 'route-forward' : 'route-back';
    last.current = { seg, cls };
  }
  return last.current.cls;
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-40" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    </div>
  );
}

const prefetchProps = (key: string) => {
  const go = () => prefetchRoute(key as RouteKey);
  return { onPointerEnter: go, onFocus: go, onTouchStart: go };
};

function Logo({ compact }: { compact?: boolean }) {
  return (
    <BrandLogo size={compact ? 40 : 32} wordmark={!compact} textClassName="text-title" />
  );
}

function BottomBar() {
  const tabs = useTabs();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const list = useRef<HTMLUListElement>(null);
  return (
    <nav
      aria-label={t('nav.main')}
      className="glass glass-strong fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-50 mx-auto max-w-lg rounded-[2rem] border p-1.5 shadow-soft land:hidden xl:hidden"
    >
      <ul ref={list} className="relative flex items-stretch justify-between gap-1">
        <SlidingPill container={list} selector='[aria-current="page"] [data-pill]' watch={pathname} className="rounded-full bg-gradient-to-br from-brand-soft/25 to-brand/20 ring-1 ring-brand/20" />
        {tabs.map(({ to, key, icon: Icon, ...rest }) => (
          <li key={key} className="relative z-10 min-w-0 flex-1">
            <NavLink to={to} end={'end' in rest} id={`nav-${key}`} {...prefetchProps(key)} className="group flex w-full flex-col items-center gap-0.5 rounded-button py-1 active:scale-95 transition-transform duration-150">
              {({ isActive }) => (
                <>
                  <span data-pill className={cn('flex h-8 w-14 max-w-full items-center justify-center rounded-full transition-colors duration-200', isActive ? 'text-primary-text' : 'text-muted group-hover:text-ink')}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className={cn('line-clamp-2 max-w-full text-center text-caption leading-tight break-words', isActive ? 'text-primary-text' : 'text-muted')}>{t(`nav.${key}`)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Tablet landscape: compact rail with icons and labels. */
function Rail() {
  const tabs = useTabs();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const list = useRef<HTMLUListElement>(null);
  const profile = useSession((s) => s.profile);
  return (
    <nav aria-label={t('nav.main')} className="glass glass-strong fixed inset-y-0 start-0 z-50 hidden w-[88px] flex-col items-center gap-1 border-e py-4 shadow-float land:flex">
      <Logo compact />
      <ul ref={list} className="relative mt-4 flex w-full flex-1 flex-col gap-1 px-2">
        <SlidingPill container={list} selector='[aria-current="page"] [data-pill]' watch={pathname} className="rounded-full bg-primary-subtle" />
        {tabs.map(({ to, key, icon: Icon, ...rest }) => (
          <li key={key} className="relative z-10">
            <NavLink to={to} end={'end' in rest} id={`rail-${key}`} {...prefetchProps(key)} className="group flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-button py-1.5 transition-transform duration-150 active:scale-95">
              {({ isActive }) => (
                <>
                  <span data-pill className={cn('flex h-8 w-12 items-center justify-center rounded-full transition-colors duration-200', isActive ? 'text-primary-text' : 'text-muted group-hover:text-ink')}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className={cn('line-clamp-2 max-w-full text-center text-caption leading-tight', isActive ? 'text-primary-text' : 'text-muted')}>{t(`nav.${key}`)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      <NavLink to="/settings" aria-label={`${t('nav.profile')}, ${t('nav.settings')}`} data-tip={t('nav.settings')} data-tip-side="end" className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-small font-semibold text-on-primary">
        {profile?.name?.[0]?.toUpperCase() ?? '?'}
      </NavLink>
    </nav>
  );
}

/** Desktop: collapsible glass sidebar. */
function Sidebar() {
  const tabs = useTabs();
  const { t } = useTranslation();
  const { pathname, hash } = useLocation();
  const list = useRef<HTMLUListElement>(null);
  const plan = useSession((s) => s.plan);
  const collapsed = useUi((s) => s.sidebarCollapsed);
  const toggle = useUi((s) => s.toggleSidebar);
  const item = (active: boolean, pill = false) =>
    cn(
      'relative z-10 flex min-h-11 items-center gap-3 rounded-button px-3 text-body transition-colors duration-200',
      collapsed && 'justify-center px-0',
      active ? cn('font-semibold text-primary-text', !pill && 'bg-primary-subtle') : 'text-ink hover:bg-raised',
    );
  const label = (text: string) => <span className={cn('truncate', collapsed && 'sr-only')}>{text}</span>;
  const extra = [
    { to: '/settings#profile', key: 'profile', icon: UserRound, text: t('nav.profile') },
    { to: '/settings', key: 'settings', icon: SettingsIcon, text: t('nav.settings') },
  ];
  return (
    <nav
      aria-label={t('nav.main')}
      className={cn('glass sticky top-0 z-40 hidden h-dvh shrink-0 flex-col border-e px-3 py-4 transition-[width] duration-200 xl:flex', collapsed ? 'w-[76px]' : 'w-64')}
    >
      <div className={cn('flex h-10 items-center px-2', collapsed && 'justify-center px-0')}>
        <Logo compact={collapsed} />
      </div>
      <ul ref={list} className="relative mt-6 flex flex-col gap-1">
        <SlidingPill container={list} selector='[aria-current="page"]' watch={`${pathname}-${collapsed}`} className="rounded-button bg-primary-subtle" />
        {tabs.map(({ to, key, icon: Icon, ...rest }) => (
          <li key={key}>
            <NavLink to={to} end={'end' in rest} id={`side-${key}`} {...prefetchProps(key)} data-tip={collapsed ? t(`nav.${key}`) : undefined} data-tip-side="end" className={({ isActive }) => item(isActive, true)}>
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              {label(t(`nav.${key}`))}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="my-4 border-t border-line" />
      <ul className="flex flex-col gap-1">
        {extra.map(({ to, key, icon: Icon, text }) => (
          <li key={key}>
            <NavLink to={to} end data-tip={collapsed ? text : undefined} data-tip-side="end" className={() => item(pathname === '/settings' && (key === 'profile' ? hash === '#profile' : hash !== '#profile'))}>
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              {label(text)}
            </NavLink>
          </li>
        ))}
        {plan !== 'pro' && (
          <li>
            <NavLink to="/plans" id="side-upgrade" data-plan-ui data-tip={collapsed ? t('plans.upgrade') : undefined} data-tip-side="end" className={cn(item(false), 'bg-accent-subtle font-semibold text-accent hover:bg-accent-subtle')}>
              <CircleArrowUp className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              {label(t('plans.upgrade'))}
            </NavLink>
          </li>
        )}
      </ul>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? t('shell.expand') : t('shell.collapse')}
        data-tip={collapsed ? t('shell.expand') : undefined}
        data-tip-side="end"
        className={cn(item(false), 'mt-auto text-muted')}
      >
        {collapsed ? <PanelLeftOpen className="h-5 w-5 shrink-0 rtl:-scale-x-100" strokeWidth={1.75} /> : <PanelLeftClose className="h-5 w-5 shrink-0 rtl:-scale-x-100" strokeWidth={1.75} />}
        {label(t('shell.collapse'))}
      </button>
    </nav>
  );
}

const THEMES: Array<{ id: VisualTheme; icon: typeof Sun }> = [
  { id: 'light', icon: Sun },
  { id: 'dark', icon: Moon },
  { id: 'system', icon: Monitor },
];

function TopBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const plan = useSession((s) => s.plan);
  const profile = useSession((s) => s.profile);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [params] = useSearchParams();
  const today = useToday();
  const onFood = location.pathname === '/food';
  const nextTheme = THEMES[(THEMES.findIndex((x) => x.id === theme) + 1) % THEMES.length];
  const ThemeIcon = THEMES.find((x) => x.id === theme)?.icon ?? Sun;
  const [q, setQ] = useState('');

  return (
    <header className="glass glass-strong sticky top-0 z-40 border-b px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 shadow-[0_1px_0_var(--glass-edge)] md:px-6 xl:px-8">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 md:max-w-3xl land:max-w-5xl xl:max-w-[1360px] 2xl:max-w-[1440px]">
        <span className="xl:hidden">
          <Logo />
        </span>
        {/* Desktop: search foods (press / to focus) and the log date */}
        <form
          role="search"
          className="relative hidden max-w-md flex-1 xl:block"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim().length >= 2) navigate(`/food?add=auto&q=${encodeURIComponent(q.trim())}`);
            setQ('');
          }}
        >
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.75} />
          <input
            id="global-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('shell.searchFoods')}
            aria-label={t('shell.searchFoods')}
            aria-keyshortcuts="/"
            className="h-10 w-full rounded-full border border-line bg-surface ps-9 pe-10 text-body text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
          <kbd className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 rounded border border-line px-1.5 text-caption text-muted">/</kbd>
        </form>
        <div className="flex items-center gap-2">
          {onFood && (
            <label className="hidden items-center gap-2 text-small text-muted xl:flex">
              <span>{t('common.date')}</span>
              <input
                id="topbar-date"
                type="date"
                value={params.get('date') ?? today}
                max={today}
                onChange={(e) => e.target.value && navigate(e.target.value === today ? '/food' : `/food?date=${e.target.value}`)}
                className="h-10 rounded-input border border-line bg-surface px-3 text-body text-ink focus:border-primary focus:outline-none"
              />
            </label>
          )}
          <button
            type="button"
            id="theme-toggle"
            onClick={() => setTheme(nextTheme.id)}
            aria-label={t('shell.themeNext', { theme: t(`settings.theme${nextTheme.id === 'system' ? 'System' : nextTheme.id === 'dark' ? 'Dark' : 'Light'}`) })}
            data-tip={t('settings.theme')}
            className="hidden h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-raised hover:text-ink md:flex"
          >
            <ThemeIcon className="h-5 w-5" strokeWidth={1.75} />
          </button>
          {plan !== 'pro' && (
            <button
              id="header-upgrade"
              data-plan-ui
              type="button"
              onClick={() => navigate('/plans')}
              className="flex h-9 items-center gap-1.5 rounded-full bg-accent-subtle px-3 text-small font-semibold text-accent transition-transform duration-150 active:scale-95 xl:hidden"
            >
              {t('plans.upgrade')}
            </button>
          )}
          <InboxButton />
          <AvatarMenu initial={profile?.name?.[0]?.toUpperCase() ?? '?'} photoURL={(profile as { photoURL?: string | null } | null)?.photoURL} />
        </div>
      </div>
    </header>
  );
}

/** Avatar: goes straight to Settings on phones; a menu on larger screens. */
function AvatarMenu({ initial, photoURL }: { initial: string; photoURL?: string | null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const plan = useSession((s) => s.plan);
  const setShortcuts = useUi((s) => s.setShortcutsOpen);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };
  const itemCls = 'flex min-h-11 w-full items-center gap-2.5 px-3.5 text-start text-body text-ink hover:bg-raised focus-visible:bg-raised';
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id="avatar-button"
        onClick={() => (window.matchMedia('(min-width: 768px)').matches ? setOpen((o) => !o) : navigate('/settings'))}
        aria-label={`${t('nav.profile')}, ${t('nav.settings')}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-150 active:scale-95"
      >
        <Avatar name={initial} photoURL={photoURL} size={40} />
      </button>
      {open && (
        <div role="menu" className="glass absolute end-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-input border py-1 shadow-float animate-[pop-in_150ms_ease-out]">
          <button role="menuitem" type="button" className={itemCls} onClick={() => go('/settings#profile')}>
            <UserRound className="h-4 w-4" strokeWidth={1.75} />
            {t('nav.profile')}
          </button>
          <button role="menuitem" type="button" className={itemCls} onClick={() => go('/settings')}>
            <SettingsIcon className="h-4 w-4" strokeWidth={1.75} />
            {t('nav.settings')}
          </button>
          {plan !== 'pro' && (
            <button role="menuitem" type="button" data-plan-ui className={itemCls} onClick={() => go('/plans')}>
              <CircleArrowUp className="h-4 w-4 text-accent" strokeWidth={1.75} />
              {t('plans.upgrade')}
            </button>
          )}
          <button
            role="menuitem"
            type="button"
            className={cn(itemCls, 'hidden xl:flex')}
            onClick={() => {
              setOpen(false);
              setShortcuts(true);
            }}
          >
            <Keyboard className="h-4 w-4" strokeWidth={1.75} />
            {t('shell.shortcuts')}
          </button>
          <div className="my-1 border-t border-line" />
          <button role="menuitem" type="button" className={cn(itemCls, 'text-danger-text')} onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            {t('settings.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}

function ShortcutsDialog() {
  const { t } = useTranslation();
  const open = useUi((s) => s.shortcutsOpen);
  const setOpen = useUi((s) => s.setShortcutsOpen);
  return (
    <Sheet open={open} onClose={() => setOpen(false)} closeLabel={t('common.close')} title={t('shell.shortcuts')}>
      <dl className="flex flex-col divide-y divide-line">
        {SHORTCUTS.map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-body text-ink">{t(`shell.shortcut.${s.id}`)}</dt>
            <dd>
              <kbd className="rounded-input border border-line bg-raised px-2.5 py-1 text-small font-semibold text-ink">{s.key === '/' ? '/' : s.key.toUpperCase()}</kbd>
            </dd>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}
