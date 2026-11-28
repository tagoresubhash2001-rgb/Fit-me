import React from 'react';
import { WebsiteLayout } from '../website/WebsiteLayout';

export default function RefundPage() {
  return (
    <WebsiteLayout
      title="Cancellation & Refund Policy | FitMe"
      description="FitMe transparent refund policy and satisfaction guarantee by Sindulis Innovative Solutions."
    >
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-10 text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1FA45B]/25 bg-[#F0FDF4] dark:bg-[#1FA45B]/15 px-3 py-1 text-xs font-semibold text-[#1FA45B]">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span>Billing &amp; Satisfaction Guarantee</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#11181C] dark:text-white">
            Cancellation &amp; Refund Policy
          </h1>
          <p className="text-sm text-[#5B6471] dark:text-[#9AA89E]">
            Sindulis Innovative Solutions · Simple, Transparent Guarantees
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-[#5B6471] dark:text-[#CBD5E1]">
          <section className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#FBFDFB] dark:bg-[#171D18] p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-bold text-[#11181C] dark:text-white flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#1FA45B]" />
              1. 7-Day Money-Back Guarantee
            </h2>
            <p>
              We want you to feel completely confident about your fitness journey. In addition to your free introductory trial period, we offer a <strong>no-questions-asked 7-day money-back guarantee</strong> following your first billing cycle. If you feel FitMe did not deliver value, simply contact our support team within 7 days of the charge for a 100% full refund.
            </p>
          </section>

          <section className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#FBFDFB] dark:bg-[#171D18] p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-bold text-[#11181C] dark:text-white flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#1FA45B]" />
              2. How to Request a Refund
            </h2>
            <p>
              To request a refund, email our billing team at <a href="mailto:support@fitme.sindulis.com" className="text-[#1FA45B] underline font-semibold">support@fitme.sindulis.com</a> with your registered account email and order reference ID.
            </p>
            <p>
              Refunds are processed within 3 to 5 business days back to your original payment method via our payment gateway partner.
            </p>
          </section>

          <section className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#FBFDFB] dark:bg-[#171D18] p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-bold text-[#11181C] dark:text-white flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#1FA45B]" />
              3. Hassle-Free Cancellation
            </h2>
            <p>
              You may cancel recurring subscriptions at any time directly in the app under <em>Settings &gt; Subscription</em>. Upon cancellation, your access remains active until the end of your current billing period, with zero subsequent charges.
            </p>
          </section>
        </div>
      </div>
    </WebsiteLayout>
  );
}
