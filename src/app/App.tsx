import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../data/session';
import { watchSession } from '../data/auth';
import { setLanguage } from '../lib/i18n';
import { useThemeStore } from '../stores/theme.store';

// Every screen is its own chunk: signed-out visitors download only the sign-in screen, signed-in users only the app.
const Shell = lazy(() => import('./Shell').then((m) => ({ default: m.Shell })));
const SignInScreen = lazy(() => import('../features/auth/SignInScreen'));
const HomeScreen = lazy(() => import('../features/home/HomeScreen'));
const Onboarding = lazy(() => import('../features/onboarding/Onboarding'));
const FoodScreen = lazy(() => import('../features/food/FoodScreen'));
const HealthScreen = lazy(() => import('../features/health/HealthScreen'));
const WorkoutsScreen = lazy(() => import('../features/workouts/WorkoutsScreen'));
const PlannerScreen = lazy(() => import('../features/planner/PlannerScreen'));
const StoreScreen = lazy(() => import('../features/store/StoreScreen'));
const SettingsScreen = lazy(() => import('../features/settings/SettingsScreen'));
const PlansScreen = lazy(() => import('../features/plans/PlansScreen'));

/** Same look as the static splash in index.html, so the hand-over from HTML to React does not flash. */
export function FullScreenLoader() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas p-6 text-center" role="status" aria-label={t('common.loading')}>
      <img src="/favicon.svg" alt="" width={72} height={72} className="h-[72px] w-[72px] motion-safe:animate-pulse" />
      <p className="text-[34px] leading-tight font-semibold text-ink">
        FIT ME <span className="text-primary-text">AI</span>
      </p>
      <p className="max-w-md text-body text-muted">{t('app.splash')}</p>
    </div>
  );
}

function Gate() {
  const { authReady, user, profileReady, profile } = useSession();
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
  if (!user)
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <SignInScreen />
      </Suspense>
    );
  if (!profileReady) return <FullScreenLoader />;
  if (!profile)
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <Onboarding />
      </Suspense>
    );

  return (
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Gate />
    </BrowserRouter>
  );
}
