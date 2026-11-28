import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { WebsiteLayout } from '../website/WebsiteLayout';

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid registered email address.');
      return;
    }
    if (!confirm) {
      setError('Please confirm that you understand this action is permanent.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db(), 'deletion_requests'), {
        email: email.trim().toLowerCase(),
        reason: reason.trim() || 'Not specified',
        requestedAt: serverTimestamp(),
        status: 'pending',
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit deletion request:', err);
      setError('An error occurred submitting the request. You can also email support@fitme.sindulis.com directly for immediate deletion.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <WebsiteLayout
      title="Request Account & Data Deletion | FitMe"
      description="Permanently delete your FitMe account and all stored health telemetry. Powered by Sindulis Innovative Solutions privacy commitments."
    >
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-10 text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-50 dark:bg-red-950/20 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
            <span>Permanent Data Erasure</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#11181C] dark:text-white">
            Delete Account &amp; Health Data
          </h1>
          <p className="text-sm text-[#5B6471] dark:text-[#9AA89E]">
            Exercise your absolute right to be forgotten. All telemetry is permanently purged.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-3xl border border-[#1FA45B]/30 bg-[#F0FDF4] dark:bg-[#1FA45B]/15 p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1FA45B] text-white">
              <svg className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#11181C] dark:text-white">
              Deletion Request Queued
            </h2>
            <p className="text-sm text-[#5B6471] dark:text-[#CBD5E1] max-w-md mx-auto leading-relaxed">
              We have received your account and telemetry deletion request for <strong>{email}</strong>. In compliance with data privacy regulations, all profile records, step history, and food logs will be permanently erased from our production servers.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="rounded-3xl border border-red-500/25 bg-red-50/50 dark:bg-red-950/15 p-6 sm:p-8 space-y-3 text-red-950 dark:text-red-200">
              <h2 className="text-lg font-bold text-red-900 dark:text-red-300 flex items-center gap-2">
                <span>⚠️</span>
                <span>Important: This action is permanent and irreversible</span>
              </h2>
              <p className="text-sm leading-relaxed">
                Submitting this request permanently erases your account, personal health profile, Health Connect step history, logged meals, and AI chat logs. This data cannot be recovered.
              </p>
            </section>

            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#FBFDFB] dark:bg-[#171D18] p-6 sm:p-8 space-y-6"
            >
              <div>
                <label htmlFor="del-email" className="block text-xs font-semibold text-[#11181C] dark:text-white mb-1.5">
                  Your Registered Account Email *
                </label>
                <input
                  id="del-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-sm text-[#11181C] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label htmlFor="del-reason" className="block text-xs font-semibold text-[#11181C] dark:text-white mb-1.5">
                  Reason for Leaving (Optional)
                </label>
                <textarea
                  id="del-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tell us how we could have done better..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-sm text-[#11181C] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                <input
                  id="del-confirm"
                  type="checkbox"
                  checked={confirm}
                  onChange={(e) => setConfirm(e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                />
                <label htmlFor="del-confirm" className="text-xs text-[#5B6471] dark:text-[#9AA89E] leading-relaxed cursor-pointer">
                  I understand that this request will permanently erase all my personal fitness history, Health Connect telemetry, and AI Coach records.
                </label>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting Deletion Request...' : 'Permanently Delete My Account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </WebsiteLayout>
  );
}
