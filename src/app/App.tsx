import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useSession } from '../data/session';
import { watchSession } from '../data/auth';
import { setLanguage } from '../lib/i18n';
import { useThemeStore } from '../stores/theme.store';
import { Shell } from './Shell';
import SignInScreen from '../features/auth/SignInScreen';
import Onboarding from '../features/onboarding/Onboarding';
import HomeScreen from '../features/home/HomeScreen';

const FoodScreen = lazy(() => import('../features/food/FoodScreen'));
const HealthScreen = lazy(() => import('../features/health/HealthScreen'));
const WorkoutsScreen = lazy(() => import('../features/workouts/WorkoutsScreen'));
const PlannerScreen = lazy(() => import('../features/planner/PlannerScreen'));
const StoreScreen = lazy(() => import('../features/store/StoreScreen'));
const SettingsScreen = lazy(() => import('../features/settings/SettingsScreen'));
const PlansScreen = lazy(() => import('../features/plans/PlansScreen'));

export function FullScreenLoader() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas" role="status" aria-label={t('common.loading')}>
      <Loader2 className="h-6 w-6 animate-spin text-primary" strokeWidth={1.75} />
    </div>
  );
}

function Gate() {
  const { authReady, user, profileReady, profile } = useSession();
  const theme = useThemeStore((s) => s.theme);
  const applyTheme = useThemeStore((s) => s.applyTheme);

  useEffect(() => watchSession(), []);
  useEffect(() => {
    applyTheme();
  }, [theme, applyTheme]);
  // The profile language wins over the device language once the user has chosen one.
  useEffect(() => {
    if (profile?.language) void setLanguage(profile.language);
  }, [profile?.language]);

  if (!authReady) return <FullScreenLoader />;
  if (!user) return <SignInScreen />;
  if (!profileReady) return <FullScreenLoader />;
  if (!profile) return <Onboarding />;

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
