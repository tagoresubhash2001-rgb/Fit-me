import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../data/session';
import { watchSession } from '../data/auth';
import { setLanguage } from '../lib/i18n';
import { useThemeStore } from '../stores/theme.store';
import { routeLoaders } from './routes';
import { isNative } from '../lib/platform';
import { APP_BASE, LEGACY_APP_PATHS, appPath, legacyTarget, rendersMemberApp } from '../lib/appPaths';

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

// Landing Page & Multi-Page Website
const HomePage = lazy(() => import('../features/website/pages/HomePage').then((m) => ({ default: m.HomePage })));
const FeaturesPage = lazy(() => import('../features/website/pages/FeaturesPage').then((m) => ({ default: m.FeaturesPage })));
const HowItWorksPage = lazy(() => import('../features/website/pages/HowItWorksPage').then((m) => ({ default: m.HowItWorksPage })));
const DownloadPage = lazy(() => import('../features/website/pages/DownloadPage').then((m) => ({ default: m.DownloadPage })));
const AboutPage = lazy(() => import('../features/website/pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const FaqPage = lazy(() => import('../features/website/pages/FaqPage').then((m) => ({ default: m.FaqPage })));
const ContactPage = lazy(() => import('../features/website/pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const NotFoundPage = lazy(() => import('../features/website/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const PrivacyPage = lazy(() => import('../features/pages/PrivacyPage'));
const TermsPage = lazy(() => import('../features/pages/TermsPage'));
const RefundPage = lazy(() => import('../features/pages/RefundPage'));
const DeleteAccountPage = lazy(() => import('../features/pages/DeleteAccountPage'));

// Native sideload updater & battery optimization
import { InAppUpdateDialog } from '../features/updater/InAppUpdateDialog';
import { BatteryOptimizationPrompt } from '../features/permissions/BatteryOptimizationPrompt';

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

/** Old member-app paths (/food, /health/water ...) now live under /app: full page load into the member app. */
function LegacyAppRedirect() {
  useEffect(() => {
    const target = legacyTarget(window.location.pathname) ?? appPath('/');
    window.location.replace(`${target}${window.location.search}${window.location.hash}`);
  }, []);
  return <FullScreenLoader />;
}

/** Shared by both trees: theme, language and the robots tag. */
function useAppChrome(noindex: boolean) {
  const theme = useThemeStore((s) => s.theme);
  const applyTheme = useThemeStore((s) => s.applyTheme);
  const { profile } = useSession();
  useEffect(() => {
    let tag = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'robots';
      document.head.appendChild(tag);
    }
    tag.content = noindex ? 'noindex, nofollow' : 'index, follow';
  }, [noindex]);
  useEffect(() => {
    applyTheme();
  }, [theme, applyTheme]);
  // The profile language wins over the device language once the user has chosen one.
  useEffect(() => {
    if (profile?.language) void setLanguage(profile.language);
  }, [profile?.language]);
}

/** Marketing website, legal pages and the admin area (web only, no basename). */
function WebsiteGate() {
  const { pathname } = useLocation();
  const admin = pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/vendor' || pathname.startsWith('/vendor/');
  useEffect(() => {
    if (!admin) return;
    return watchSession();
  }, [admin]);
  useAppChrome(admin);
  if (admin)
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="admin/*" element={<AdminApp />} />
          <Route path="vendor/*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    );
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="features" element={<FeaturesPage />} />
        <Route path="how-it-works" element={<HowItWorksPage />} />
        <Route path="download" element={<DownloadPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="refund" element={<RefundPage />} />
        <Route path="delete-account" element={<DeleteAccountPage />} />
        <Route path="p/:slug" element={<PageView />} />
        {LEGACY_APP_PATHS.map((p) => (
          <Route key={p} path={`${p}/*`} element={<LegacyAppRedirect />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

/** Member app: /app/* on the web (router basename /app), the whole app in the native shells. */
function MemberGate() {
  const { authReady, user, profileReady, profile } = useSession();
  const { pathname } = useLocation();

  useEffect(() => watchSession(), []);
  useAppChrome(true);

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
          <Route path="stories" element={<TestimonialsScreen />} />
          <Route path="help" element={<HelpScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
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
  // Decided once per page load: the member app (native shells and /app/* on the web) or the website.
  const member = rendersMemberApp();
  return (
    <BrowserRouter basename={member && !isNative() ? APP_BASE : undefined}>
      <PermissionProvider>
        {member ? <MemberGate /> : <WebsiteGate />}
        {member && (
          <>
            {isNative() && <InAppUpdateDialog />}
            {isNative() && <BatteryOptimizationPrompt />}
            <DeferredGates />
          </>
        )}
      </PermissionProvider>
    </BrowserRouter>
  );
}
