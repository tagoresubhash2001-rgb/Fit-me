import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { FullScreenLoader } from './FullScreenLoader';
import { LEGACY_APP_PATHS, appPath, legacyTarget } from '../lib/appPaths';

/**
 * Entry for the marketing website (every path except /app/* and /admin/*). It does not load Firebase or the
 * member app; pages that read data (download release info, testimonials, contact, account deletion) import
 * Firebase themselves when they need it.
 */
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
const PageView = lazy(() => import('../features/pages/PageView'));

/** Old member-app paths (/food, /health/water ...) now live under /app. */
function LegacyAppRedirect() {
  useEffect(() => {
    const target = legacyTarget(window.location.pathname) ?? appPath('/');
    window.location.replace(`${target}${window.location.search}${window.location.hash}`);
  }, []);
  return <FullScreenLoader />;
}

/** While a page chunk loads, keep showing the prerendered markup of this page (scripts/prerender-site.mjs). */
function StaticFallback() {
  const html = (window as Window & { __FITME_STATIC__?: string }).__FITME_STATIC__;
  if (!html || html.includes('class="boot"')) return <FullScreenLoader />;
  return <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function WebsiteApp() {
  return (
    <BrowserRouter>
      <Suspense fallback={<StaticFallback />}>
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
    </BrowserRouter>
  );
}
