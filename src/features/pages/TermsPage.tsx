import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 selection:bg-[#1FA45B] selection:text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0A0F1D]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2.5 text-slate-200 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to FitMe</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="FitMe" width={28} height={28} className="h-7 w-7 rounded-lg" />
            <span className="font-semibold tracking-tight text-white">FitMe</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <FileText className="h-3.5 w-3.5" />
            <span>User Agreement</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Last Updated: November 26, 2026 · Sindulis Innovative Solutions
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
            <p className="mt-3">
              By accessing the FitMe mobile application or website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not download, install, or use the service.
            </p>
          </section>

          <section className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 text-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-white">2. Medical Disclaimer</h2>
                <p className="mt-2 text-sm leading-relaxed text-amber-200/90">
                  FitMe is designed purely as an informational lifestyle and personal wellness tool. FitMe is NOT a licensed medical care provider and does NOT diagnose, treat, or prevent any illness, cardiac condition, or medical disorder. Always consult a qualified medical professional before starting any new fitness program or altering your nutrition regimen. In the event of acute symptoms (e.g. chest pain, severe shortness of breath), seek immediate emergency assistance.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">3. Free Trial and Subscription Terms</h2>
            <p className="mt-3">
              FitMe provides an introductory 7-day all-feature free experience, followed by an optional 30-day trial period upon plan selection. Unless cancelled before the trial ends, your chosen subscription (Monthly, Quarterly, or Annual) will renew automatically. Subscriptions can be cancelled at any time without cancellation penalties.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">4. Direct Sideload Distribution</h2>
            <p className="mt-3">
              The FitMe Android APK distributed directly through our website is digitally signed by Sindulis Innovative Solutions. You agree to download updates exclusively through official FitMe channels to guarantee application integrity and cryptographic security.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">5. Account Termination</h2>
            <p className="mt-3">
              You may terminate your account at any time through the in-app settings or via our web deletion portal at <Link to="/delete-account" className="text-emerald-400 underline">fit-me1.web.app/delete-account</Link>. All personal health records and synced telemetry are permanently erased upon request.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
