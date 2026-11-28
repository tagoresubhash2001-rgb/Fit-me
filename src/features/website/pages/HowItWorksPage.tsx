import React from 'react';
import { Link } from 'react-router-dom';
import { WebsiteLayout } from '../WebsiteLayout';

const STEPS = [
  {
    step: '01',
    title: 'Download & Sideload the APK',
    summary: 'Direct signed release from our verified Firebase servers.',
    description: 'Tap "Download for Android" on your phone to fetch the latest FitMe-v2.0.1.apk (11.4 MB). When prompted by your browser, grant the standard "Install unknown apps" permission. FitMe is signed with our official production keystore and contains zero bloatware or trackers.',
    highlights: [
      'Fast 11.4 MB universal APK that works on any Android phone (Android 8.0+)',
      'Direct installation without requiring a Google Play Store sign-in',
      'Integrated in-app updater automatically notifies you of future updates',
    ],
    actionLink: '/download',
    actionText: 'Get the Android APK',
  },
  {
    step: '02',
    title: 'Sign In & Set Personalized Goals',
    summary: 'Calibrated calorie budgets and macro recommendations.',
    description: 'Launch FitMe and sign in securely with Google or email. Input your biological profile (age, height, weight, activity baseline) and fitness target (fat loss, maintenance, muscle building). FitMe instantly calculates your Total Daily Energy Expenditure (TDEE) and optimal protein/carb/fat targets.',
    highlights: [
      'Available in 10 global languages (English, Hindi, Telugu, Tamil, Arabic, Spanish...)',
      'Custom macro presets calibrated by certified sports nutrition formulas',
      'Option to customize target daily steps from 5,000 to 25,000 steps',
    ],
    actionLink: '/features#food-macros',
    actionText: 'Explore Macro Engine',
  },
  {
    step: '03',
    title: 'Connect Health Connect & Sensors',
    summary: 'Accurate motion telemetry and heart rate monitoring.',
    description: 'With one tap, connect to Google Health Connect or device motion sensors. FitMe reads your steps, active calories, and heart rate telemetry in the background using Android WorkManager—meaning tracking continues reliably even when the app is minimized and your phone screen is turned off.',
    highlights: [
      'Certified Google Health Connect native integration',
      'Compatible with smartwatches, fitness bands, and smart rings',
      'Battery optimization guide ensures Xiaomi, Samsung, Oppo & Vivo phones do not kill background sync',
    ],
    actionLink: '/features#activity',
    actionText: 'Learn About Health Sync',
  },
  {
    step: '04',
    title: 'Daily Tracking & AI Coaching',
    summary: 'Actionable wellness habits and progressive overload.',
    description: 'Log your meals, check your cardio telemetry during workouts, log your water intake, and consult your personal AI fitness coach for instant adjustments. Review your weekly progress report cards to see real biometric improvements.',
    highlights: [
      'Instant nutritional search with Indian and international foods',
      'AI Coach adapts workout volume if you had poor sleep recovery',
      'Detailed streak counter and celebratory milestone rings',
    ],
    actionLink: '/features#ai-coach',
    actionText: 'Discover AI Coaching',
  },
];

export function HowItWorksPage() {
  return (
    <WebsiteLayout
      title="How FitMe Works – Step-by-Step Setup & Health Sync"
      description="Learn how FitMe works: from downloading the native Android APK and connecting Health Connect sensors to personalized nutrition tracking and AI coaching."
    >
      {/* Hero Header */}
      <section className="pt-8 pb-16 bg-gradient-to-b from-[#F0FDF4]/60 to-white dark:from-[#152018] dark:to-[#111613]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1FA45B]/10 text-[#1FA45B] text-xs font-bold uppercase tracking-wider">
            Quick Start Guide
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
            How FitMe transforms your daily health.
          </h1>
          <p className="text-base sm:text-lg text-[#5B6471] dark:text-[#9AA89E] max-w-2xl mx-auto">
            From direct sideload installation to continuous background step telemetry and AI-driven coaching in 4 simple steps.
          </p>
        </div>
      </section>

      {/* 4 Steps Timeline */}
      <section className="py-16 sm:py-24 bg-white dark:bg-[#111613]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-16">
          {STEPS.map((step, idx) => (
            <div
              key={step.step}
              className="relative grid grid-cols-1 md:grid-cols-12 gap-8 items-start p-8 sm:p-10 rounded-3xl bg-[#FBFDFB] dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 shadow-xs"
            >
              {/* Step Number Badge */}
              <div className="md:col-span-2 flex flex-col items-center sm:items-start">
                <span className="text-4xl sm:text-5xl font-black text-[#1FA45B] tracking-tight">
                  {step.step}
                </span>
                <span className="text-xs font-semibold text-[#8C96A5] uppercase tracking-wider mt-1">
                  Step {idx + 1}
                </span>
              </div>

              {/* Step Content */}
              <div className="md:col-span-10 space-y-4 text-left">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
                  {step.title}
                </h2>
                <p className="text-base font-semibold text-[#1FA45B]">
                  {step.summary}
                </p>
                <p className="text-base text-[#5B6471] dark:text-[#9AA89E] leading-relaxed">
                  {step.description}
                </p>

                {/* Highlights */}
                <div className="pt-2 space-y-2">
                  {step.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-[#11181C] dark:text-slate-200">
                      <svg className="h-4 w-4 text-[#1FA45B] shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                {/* Action Link */}
                <div className="pt-4">
                  <Link
                    to={step.actionLink}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1FA45B] hover:text-[#178A4C] hover:underline"
                  >
                    <span>{step.actionText}</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sideload Safety Assurance Section */}
      <section className="py-16 bg-[#FBFDFB] dark:bg-[#151B17] border-t border-slate-200/80 dark:border-white/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-[#F0FDF4] flex items-center justify-center text-[#1FA45B]">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#11181C] dark:text-white">
            Why does Android prompt "Install unknown apps"?
          </h2>
          <p className="text-base text-[#5B6471] dark:text-[#9AA89E] leading-relaxed max-w-2xl mx-auto">
            Android displays this generic security prompt for <strong>every</strong> application downloaded outside Google Play. Because FitMe is distributed directly from our secure Firebase infrastructure, you simply tap "Settings" and toggle "Allow from this source". Our APK is cryptographically signed and 100% safe.
          </p>
          <div className="pt-2">
            <Link
              to="/download"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#1FA45B] hover:bg-[#178A4C] text-white font-semibold text-sm shadow-sm"
            >
              <span>Download & Install Guide</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
