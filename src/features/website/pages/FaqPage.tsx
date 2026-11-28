import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { WebsiteLayout } from '../WebsiteLayout';

interface FaqItem {
  q: string;
  a: React.ReactNode;
  category: 'Installation' | 'Privacy & Data' | 'Features' | 'Devices';
}

const FAQ_ITEMS: FaqItem[] = [
  {
    category: 'Installation',
    q: 'Why does Android warn me with "File might be harmful" or "Install unknown apps"?',
    a: (
      <div className="space-y-2">
        <p>
          Android automatically displays this warning whenever you install an application downloaded directly from a web browser rather than from the Google Play Store. This is Google's blanket protection system for all third-party APKs.
        </p>
        <p>
          <strong>FitMe is 100% safe and verified:</strong> The APK is built, compiled, and cryptographically signed with our verified release keystore and hosted on Google's own Firebase Cloud infrastructure. To proceed, simply tap <em>Settings</em> and enable <em>"Allow from this source"</em>.
        </p>
      </div>
    ),
  },
  {
    category: 'Installation',
    q: 'When is the iPhone (iOS) version releasing?',
    a: (
      <div className="space-y-2">
        <p>
          The native iOS version is currently in development with native Swift and Apple HealthKit frameworks. Because Apple HealthKit background step counting cannot be accessed via a Progressive Web App (PWA), we are taking the time to build a true native iOS application.
        </p>
        <p>
          You can join our <Link to="/download#ios-waitlist" className="text-[#1FA45B] underline font-semibold">iOS Notification Waitlist</Link> on the Download page to be invited to our early TestFlight release.
        </p>
      </div>
    ),
  },
  {
    category: 'Installation',
    q: 'How do in-app updates work without the Google Play Store?',
    a: (
      <p>
        FitMe features a built-in update check on launch. When a new version is published, FitMe displays an "Update Available" dialog highlighting the new features and release notes. Tapping "Update" downloads and launches the new package installer seamlessly.
      </p>
    ),
  },
  {
    category: 'Privacy & Data',
    q: 'What health data does FitMe collect, and how is it protected?',
    a: (
      <div className="space-y-2">
        <p>
          FitMe collects only the health metrics you explicitly authorize: daily steps, active calorie expenditure, heart rate telemetry, logged meals and macros, water intake, and workout routes.
        </p>
        <p>
          We do not sell, broker, or monetize your health data. All data transmissions are encrypted via TLS 1.3, and access is protected by strict Firebase Security Rules. For full details, review our <Link to="/privacy" className="text-[#1FA45B] underline font-semibold">Privacy Policy</Link>.
        </p>
      </div>
    ),
  },
  {
    category: 'Privacy & Data',
    q: 'How can I permanently delete my account and all associated health data?',
    a: (
      <p>
        You can request permanent account and telemetry deletion at any time directly inside the app under <em>Settings &gt; Privacy &gt; Delete Account</em>, or online via our dedicated <Link to="/delete-account" className="text-[#1FA45B] underline font-semibold">Account Deletion Page</Link>. All records across Firestore and Cloud Storage are erased within 30 days.
      </p>
    ),
  },
  {
    category: 'Devices',
    q: 'How does background step counting work without draining my phone battery?',
    a: (
      <p>
        FitMe interfaces with the Android hardware step sensor and Google Health Connect client. Rather than running a constant GPS drain, step counting uses low-power hardware interrupts. Our background sync uses Android WorkManager, consuming less than 1.2% battery over a full 24-hour cycle.
      </p>
    ),
  },
  {
    category: 'Devices',
    q: 'Why does FitMe ask for battery optimization exceptions on Xiaomi, Oppo, or Samsung phones?',
    a: (
      <p>
        Certain Android manufacturers (MIUI/HyperOS, ColorOS, FunTouch, OneUI) aggressively kill background processes when the screen is locked, which can stop step counting and freeze reminder notifications. FitMe provides a quick one-tap guide to whitelist the app from aggressive battery killing.
      </p>
    ),
  },
  {
    category: 'Features',
    q: 'Does FitMe work offline without an active internet connection?',
    a: (
      <p>
        Yes. Hardware step counting, active workout timers, and offline meal logging work without cellular or Wi-Fi connectivity. Data is cached locally on your device and automatically synchronizes to your cloud profile once your phone reconnects to the internet.
      </p>
    ),
  },
];

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const categories = ['All', 'Installation', 'Privacy & Data', 'Devices', 'Features'];

  const filteredFaqs = filterCategory === 'All'
    ? FAQ_ITEMS
    : FAQ_ITEMS.filter((f) => f.category === filterCategory);

  const toggleAccordion = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <WebsiteLayout
      title="FAQ – Frequently Asked Questions | FitMe"
      description="Find answers to common questions about FitMe: Android APK installation, security warnings, Health Connect synchronization, iOS availability, and data privacy."
    >
      {/* Header */}
      <section className="pt-8 pb-14 bg-gradient-to-b from-[#F0FDF4]/60 to-white dark:from-[#152018] dark:to-[#111613]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1FA45B]/10 text-[#1FA45B] text-xs font-bold uppercase tracking-wider">
            Help & Documentation
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-base sm:text-lg text-[#5B6471] dark:text-[#9AA89E] max-w-2xl mx-auto">
            Everything you need to know about installing, using, and managing your health telemetry with FitMe.
          </p>

          {/* Filter Pills */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilterCategory(c)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  filterCategory === c
                    ? 'bg-[#1FA45B] text-white shadow-xs'
                    : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[#5B6471] dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Accordion Section */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#111613]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-4">
          {filteredFaqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-[#FBFDFB] dark:bg-[#171D18] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-5 text-left text-base font-bold text-[#11181C] dark:text-white hover:text-[#1FA45B] transition-colors focus:outline-none"
                >
                  <span className="pr-4">{faq.q}</span>
                  <span
                    className={`h-6 w-6 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0 text-sm font-semibold transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#1FA45B] bg-[#F0FDF4]' : 'text-slate-500'
                    }`}
                  >
                    ↓
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-[#5B6471] dark:text-[#9AA89E] leading-relaxed border-t border-slate-100 dark:border-white/5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Prompt */}
      <section className="py-14 bg-[#FBFDFB] dark:bg-[#151B17] border-t border-slate-200/80 dark:border-white/10 text-center">
        <div className="mx-auto max-w-xl px-4 space-y-3">
          <h2 className="text-xl font-bold text-[#11181C] dark:text-white">
            Have a question not answered here?
          </h2>
          <p className="text-sm text-[#5B6471] dark:text-[#9AA89E]">
            Our support team at Sindulis Innovative Solutions is here to help.
          </p>
          <div className="pt-2">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1FA45B] hover:underline"
            >
              <span>Contact our support team</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
