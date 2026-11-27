import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle2, HelpCircle, Mail } from 'lucide-react';

export default function RefundPage() {
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
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Fair Billing &amp; Satisfaction Guarantee</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Cancellation &amp; Refund Policy
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sindulis Innovative Solutions · Simple, Transparent Guarantees
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              1. 7-Day Money-Back Guarantee
            </h2>
            <p className="mt-3">
              We want you to feel completely confident about your fitness journey. In addition to your free introductory trial period, we offer a <strong>no-questions-asked 7-day money-back guarantee</strong> following your first billing cycle. If you feel FitMe did not deliver value, simply contact our support team within 7 days of the charge for a 100% full refund.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <RefreshCw className="h-5 w-5 text-emerald-400" />
              2. How to Cancel Your Subscription
            </h2>
            <p className="mt-3">
              You can cancel your subscription at any time without fees:
            </p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>
                <strong>In the FitMe App:</strong> Go to <em>Settings &rarr; Subscriptions &rarr; Manage Plan</em> and tap &quot;Cancel Subscription&quot;. Your premium access remains active until the end of your current paid billing period.
              </li>
              <li>
                <strong>Via Email:</strong> Email our support desk at <a href="mailto:support@fitme.ai" className="text-emerald-400 underline">support@fitme.ai</a> with your registered email address, and our team will handle the cancellation manually.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <HelpCircle className="h-5 w-5 text-emerald-400" />
              3. Processing Time
            </h2>
            <p className="mt-3">
              Approved refunds are credited directly back to the original payment method (Cashfree / UPI / Card / NetBanking) within <strong>5 to 7 business days</strong>, depending on your financial institution.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Mail className="h-5 w-5 text-emerald-400" />
              4. Contact Support
            </h2>
            <p className="mt-3">
              Questions regarding an invoice or refund? Email us at:
            </p>
            <p className="mt-2 text-slate-200">
              Sindulis Innovative Solutions<br />
              Email: <a href="mailto:sinfoxmedia@gmail.com" className="text-emerald-400 underline">sinfoxmedia@gmail.com</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
