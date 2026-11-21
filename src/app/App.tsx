import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../data/session';
import { watchSession } from '../data/auth';
import { setLanguage } from '../lib/i18n';
import { useThemeStore } from '../stores/theme.store';
import { routeLoaders } from './routes';

// Every screen is its own chunk: signed-out visitors download only the sign-in screen, signed-in users only the app.
const Shell = lazy(() => import('./Shell').then((m) => ({ default: m.Shell })));
const SignInScreen = lazy(() => import('../features/auth/SignInScreen'));
const Onboarding = lazy(() => import('../features/onboarding/Onboarding'));
const HomeScreen = lazy(routeLoaders.home);
const FoodScreen = lazy(routeLoaders.food);
const HealthScreen = lazy(routeLoaders.health);
const WorkoutsScreen = lazy(routeLoaders.workouts);
const PlannerScreen = lazy(routeLoaders.planner);
const StoreScreen = lazy(routeLoaders.store);
const SettingsScreen = lazy(routeLoaders.settings);
const PlansScreen = lazy(routeLoaders.plans);
const TestimonialsScreen = lazy(routeLoaders.stories);
import { PermissionProvider } from '../features/permissions/PermissionPrimer';
const AdminApp = lazy(() => import('../features/admin/AdminApp'));
const PageView = lazy(() => import('../features/pages/PageView'));
const HelpScreen = lazy(() => import('../features/pages/HelpScreen'));
const LateGates = lazy(() => import('./Gates'));

/** Same look as the static splash in index.html, so the hand-over from HTML to React does not flash. */
export function FullScreenLoader() {
  const { t } = useTranslation();
  // Never a stuck spinner: after 12 s offer a retry (slow network, blocked storage, offline first visit).
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 12000);
    return () => clearTimeout(id);
  }, []);
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas p-6 text-center"
      role="status"
      aria-label={t('common.loading')}
    >
      <img src="/favicon.svg" alt="" width={72} height={72} className="h-[72px] w-[72px] motion-safe:animate-pulse" />
      <p className="text-[34px] leading-tight font-semibold text-ink">FitMe</p>
      <p className="max-w-md text-body text-muted">{slow ? t('errors.slowBody') : t('app.tagline')}</p>
      {slow && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-12 rounded-button bg-primary px-5 text-body font-semibold text-on-primary"
        >
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}

function Gate() {
  const { authReady, user, profileReady, profile } = useSession();
  const { pathname } = useLocation();
  const theme = useThemeStore((s) => s.theme);
  const applyTheme = useThemeStore((s) => s.applyTheme);

  useEffect(() => watchSession(), []);
  // Only the public sign-in page may be indexed; everything behind sign-in is noindex.
  useEffect(() => {
    let tag = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'robots';
      document.head.appendChild(tag);
    }
    tag.content = user ? 'noindex, nofollow' : 'index, follow';
  }, [user]);
  useEffect(() => {
    applyTheme();
  }, [theme, applyTheme]);
  // The profile language wins over the device language once the user has chosen one.
  useEffect(() => {
    if (profile?.language) void setLanguage(profile.language);
  }, [profile?.language]);

  if (!authReady) return <FullScreenLoader />;
  // Published pages (terms, privacy, help, tips) are public.
  if (pathname.startsWith('/p/'))
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="p/:slug" element={<PageView />} />
        </Routes>
      </Suspense>
    );
  // Admin dashboard: its own sign-in and layout, independent of the member onboarding.
  if (pathname === '/admin' || pathname.startsWith('/admin/'))
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    );
  if (!user)
    return (
      <>
        <Suspense fallback={<FullScreenLoader />}>
          <SignInScreen />
        </Suspense>
      </>
    );
  if (!profileReady) return <FullScreenLoader />;
  if (!profile)
    return (
      <>
        <Suspense fallback={<FullScreenLoader />}>
          <Onboarding />
        </Suspense>
      </>
    );

  return (
    <>
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<HomeScreen />} />
            <Route path="food" element={<FoodScreen />} />
            <Route path="planner" element={<PlannerScreen />} />
            <Route path="health" element={<HealthScreen />} />
            <Route path="health/:tab" element={<HealthScreen />} />
            <Route path="workouts" element={<WorkoutsScreen />} />
            <Route path="store" element={<StoreScreen />} />
            <Route path="settings" element={<SettingsScreen />} />
            <Route path="plans" element={<PlansScreen />} />
            <Route path="stories" element={<TestimonialsScreen />} />
            <Route path="help" element={<HelpScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

/** Loads the admin-controlled gates (maintenance, forced update, text overrides) once the first screen is painted. */
function DeferredGates() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(() => setReady(true), { timeout: 2500 });
    else setTimeout(() => setReady(true), 1200);
  }, []);
  return ready ? (
    <Suspense fallback={null}>
      <LateGates />
    </Suspense>
  ) : null;
}

export default function App() {
  return (
    <BrowserRouter>
      <PermissionProvider>
        <Gate />
        <DeferredGates />
      </PermissionProvider>
    </BrowserRouter>
  );
}
