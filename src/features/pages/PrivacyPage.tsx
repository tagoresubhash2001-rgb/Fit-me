import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Heart, Activity, Lock, Database, Trash2, Mail } from 'lucide-react';

export default function PrivacyPage() {
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
            <Shield className="h-3.5 w-3.5" />
            <span>Health Data Privacy & Protection</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Privacy Policy & Health Data Governance
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Effective Date: November 26, 2026 · Sindulis Innovative Solutions
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Heart className="h-5 w-5 text-emerald-400" />
              1. Our Commitment to Your Health Privacy
            </h2>
            <p className="mt-3">
              FitMe (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is operated by Sindulis Innovative Solutions. Your health and fitness data is sensitive, personal, and entirely yours. We believe health telemetry should empower you—never be weaponized for advertising, rented, or sold. This Privacy Policy details exactly what data we collect, how we process it, where it is stored, and your unconditional right to delete it.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Activity className="h-5 w-5 text-emerald-400" />
              2. What Health & Fitness Data We Collect
            </h2>
            <p className="mt-3">
              With your explicit, opt-in permission, FitMe accesses and syncs specific health metrics from <strong>Android Health Connect</strong> and your device&apos;s physical motion sensors:
            </p>
            <ul className="mt-3 space-y-2 list-disc pl-5 text-slate-300">
              <li>
                <strong className="text-white">Daily Steps & Distance:</strong> Recorded via Android Health Connect or the onboard step detector hardware sensor to compute activity rings, streaks, and distance walked.
              </li>
              <li>
                <strong className="text-white">Heart Rate & Resting Heart Rate:</strong> Pulse samples gathered from connected smartwatches or Wear OS devices through Health Connect to provide cardiovascular intensity zones.
              </li>
              <li>
                <strong className="text-white">Active & Basal Caloric Expenditure:</strong> Energy burned through daily movement and recorded workouts to calibrate your caloric balance against your targets.
              </li>
              <li>
                <strong className="text-white">Sleep Metrics:</strong> Sleep duration and sleep stage intervals (deep, light, REM) to deliver recovery scores and rest recommendations.
              </li>
              <li>
                <strong className="text-white">Workout & Route Information:</strong> Timestamp, duration, and exercise category (running, cycling, walking) alongside optional GPS breadcrumbs captured only while a workout session is actively running.
              </li>
              <li>
                <strong className="text-white">Dietary & Meal Logs:</strong> Calories, macronutrients (protein, carbohydrates, fats, fiber), and optional meal photos logged by you.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Database className="h-5 w-5 text-emerald-400" />
              3. How We Use and Process Your Information
            </h2>
            <p className="mt-3">
              We process health metrics strictly for the following functional purposes:
            </p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>Calculating your basal metabolic rate (BMR), total daily energy expenditure (TDEE), and macro breakdown.</li>
              <li>Powering our AI Fitness Coaches (Jai &amp; Jaya) to deliver tailored workout advice and dietary feedback.</li>
              <li>Synchronizing your data across devices securely when you sign in.</li>
              <li>Sending reminders for hydration, movement goals, and bedtime routines.</li>
            </ul>
            <p className="mt-3 text-emerald-400/90 font-medium">
              We do NOT sell, lease, or monetize your health data. We never use health metrics for third-party advertising or profiling.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Lock className="h-5 w-5 text-emerald-400" />
              4. Storage, Encryption &amp; Security
            </h2>
            <p className="mt-3">
              All user records are stored in Google Cloud Firestore infrastructure located in secure cloud facilities. Data in transit is protected using TLS 1.3 encryption, and data at rest is encrypted with AES-256 keys. Cloud Firestore Security Rules strictly restrict document access exclusively to the verified account owner.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Trash2 className="h-5 w-5 text-rose-400" />
              5. Data Retention &amp; Permanent Deletion
            </h2>
            <p className="mt-3">
              You maintain total sovereignty over your health records:
            </p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>
                <strong>In-App Deletion:</strong> Inside the FitMe Android app, navigate to <em>Settings &rarr; Account &rarr; Delete Account</em> to permanently wipe all stored metrics, cloud backups, and authentication profiles in real time.
              </li>
              <li>
                <strong>Web Deletion Portal:</strong> If you uninstalled the app or prefer to request deletion via the web, you can submit an instant removal request at <Link to="/delete-account" className="text-emerald-400 underline hover:text-emerald-300">fit-me1.web.app/delete-account</Link>.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Mail className="h-5 w-5 text-emerald-400" />
              6. Contact Us
            </h2>
            <p className="mt-3">
              For any questions or privacy inquiries regarding your health data, contact our Data Protection Officer:
            </p>
            <p className="mt-2 text-slate-200">
              Sindulis Innovative Solutions<br />
              Email: <a href="mailto:sinfoxmedia@gmail.com" className="text-emerald-400 underline">sinfoxmedia@gmail.com</a> / <a href="mailto:support@fitme.ai" className="text-emerald-400 underline">support@fitme.ai</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
