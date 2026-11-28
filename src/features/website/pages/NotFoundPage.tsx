import React from 'react';
import { Link } from 'react-router-dom';
import { WebsiteLayout } from '../WebsiteLayout';

export function NotFoundPage() {
  return (
    <WebsiteLayout
      title="404 – Page Not Found | FitMe"
      description="The page you were looking for does not exist or has been moved."
    >
      <section className="py-24 sm:py-32 flex flex-col items-center justify-center text-center px-4">
        <div className="h-16 w-16 rounded-2xl bg-[#F0FDF4] dark:bg-[#1FA45B]/15 border border-[#1FA45B]/20 flex items-center justify-center text-[#1FA45B] shadow-sm mb-6">
          <img src="/favicon.svg" alt="FitMe" width={40} height={40} className="h-10 w-10 rounded-lg" />
        </div>

        <span className="text-sm font-bold text-[#1FA45B] uppercase tracking-widest">
          Error 404
        </span>

        <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
          Page Not Found
        </h1>

        <p className="mt-4 text-base text-[#5B6471] dark:text-[#9AA89E] max-w-md">
          The link you clicked may be broken or the page may have been moved as part of our multi-page website update.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/"
            className="h-11 px-6 rounded-xl bg-[#1FA45B] hover:bg-[#178A4C] text-white font-semibold text-sm shadow-sm transition-all"
          >
            Back to Home
          </Link>
          <Link
            to="/download"
            className="h-11 px-6 rounded-xl border border-slate-300 dark:border-white/20 text-[#11181C] dark:text-white font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Download Mobile App
          </Link>
        </div>
      </section>
    </WebsiteLayout>
  );
}
