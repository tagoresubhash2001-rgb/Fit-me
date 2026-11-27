import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, Mail, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

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
      // Even if Firestore offline or write error, provide immediate fallback reassurance
      setError('An error occurred submitting the request. You can also email privacy@fitme.ai directly for immediate deletion.');
    } finally {
      setSubmitting(false);
    }
  };

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
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400">
            <Trash2 className="h-3.5 w-3.5" />
            <span>Account &amp; Health Data Deletion</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Request Account &amp; Data Deletion
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            FitMe complies with GDPR, Google Play Health Data Policy, and international user data rights.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center sm:text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">Deletion Request Received</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              We have received your account and data deletion request for <strong>{email}</strong>.
            </p>
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 space-y-2">
              <p>• All your personal records, health data (steps, heart rate, workouts), and login credentials will be permanently erased.</p>
              <p>• Processing typically completes within 24 to 48 hours.</p>
              <p>• A confirmation receipt will be sent to your registered email address.</p>
            </div>
            <Link
              to="/"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#1FA45B] px-6 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Return to Homepage
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                <div className="text-sm text-slate-300">
                  <p className="font-semibold text-white">What happens when your account is deleted?</p>
                  <p className="mt-1">
                    All your stored profiles, cloud backups, health logs (steps, heart rate, sleep, workouts), diet history, custom meal plans, and subscription entitlements will be <strong>permanently and irreversibly destroyed</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8">
              <h2 className="text-base font-semibold text-white">Submit Deletion Request Form</h2>
              <p className="mt-1 text-xs text-slate-400">
                Enter the email address associated with your FitMe account.
              </p>

              {error && (
                <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Account Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Reason for Deletion (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Help us improve: tell us why you are leaving FitMe..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="confirm"
                    checked={confirm}
                    onChange={(e) => setConfirm(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <label htmlFor="confirm" className="text-xs leading-relaxed text-slate-300 cursor-pointer">
                    I understand that deleting my account will permanently delete all my health data, workouts, and subscription history, and this action cannot be undone.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Permanently Delete My Account &amp; Data</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* In-App Instructions */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 text-xs text-slate-400">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Instant In-App Deletion</span>
              </div>
              <p className="mt-2 leading-relaxed">
                If you still have the FitMe mobile app installed, you can delete your account instantly without waiting for manual verification: open FitMe &rarr; tap <strong>Settings</strong> &rarr; <strong>Account</strong> &rarr; <strong>Delete Account</strong>.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
