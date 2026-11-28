import React from 'react';
import { Link } from 'react-router-dom';
import { WebsiteLayout } from '../WebsiteLayout';

const PILLARS = [
  {
    title: 'Absolute Biometric Privacy',
    desc: 'Your steps, heart rate, nutrition, and personal vitals belong to you. FitMe does not monetize, broker, or sell sensitive biometric data to third-party ad networks or data brokers.',
  },
  {
    title: 'Native-First Reliability',
    desc: 'Web-based health dashboards lose sync the second your phone screen turns off. FitMe is engineered with native Android services and Google Health Connect for zero-compromise accuracy.',
  },
  {
    title: 'Global Health Inclusivity',
    desc: 'Health is a universal human right. FitMe is localized natively into 10 languages: English, Hindi (हिंदी), Telugu (తెలుగు), Tamil (தமிழ்), Arabic (العربية), Spanish (Español), French (Français), German (Deutsch), Portuguese (Português), and Indonesian (Bahasa Indonesia).',
  },
  {
    title: 'Transparent Direct Distribution',
    desc: 'By delivering FitMe directly to you, we eliminate store middleman friction, deliver rapid updates, and maintain high standards of engineering integrity.',
  },
];

export function AboutPage() {
  return (
    <WebsiteLayout
      title="About FitMe – Sindulis Innovative Solutions"
      description="Learn about FitMe and Sindulis Innovative Solutions: our mission, values, on-device biometric privacy principles, and global multi-language accessibility."
    >
      {/* Header */}
      <section className="pt-8 pb-16 bg-gradient-to-b from-[#F0FDF4]/60 to-white dark:from-[#152018] dark:to-[#111613]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1FA45B]/10 text-[#1FA45B] text-xs font-bold uppercase tracking-wider">
            About Sindulis Innovative Solutions
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
            Building technology for a healthier world.
          </h1>
          <p className="text-base sm:text-lg text-[#5B6471] dark:text-[#9AA89E] max-w-2xl mx-auto">
            FitMe was born out of a simple belief: accurate, personalized health telemetry should be fast, private, and accessible to everyone.
          </p>
        </div>
      </section>

      {/* Mission & Story */}
      <section id="mission" className="py-16 sm:py-24 bg-white dark:bg-[#111613] scroll-mt-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-6 space-y-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1FA45B]">
                Our Mission
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#11181C] dark:text-white tracking-tight leading-snug">
                Empowering individuals to master their health with verifiable data.
              </p>
              <p className="text-base text-[#5B6471] dark:text-[#9AA89E] leading-relaxed">
                Modern health apps are frequently bloated with advertisements, aggressive upselling, and unreliable web telemetry. At Sindulis Innovative Solutions, we chose a different path: build a clean, native companion that runs quietly in the background, tracks vitals accurately, and provides actionable intelligence.
              </p>
              <p className="text-base text-[#5B6471] dark:text-[#9AA89E] leading-relaxed">
                Whether you are tracking daily steps, managing macro nutrition for athletic goals, or correlating sleep quality with workout output, FitMe gives you the tools to succeed without friction.
              </p>
            </div>

            <div className="md:col-span-6 p-8 rounded-3xl bg-[#FBFDFB] dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <img src="/favicon.svg" alt="FitMe" width={40} height={40} className="h-10 w-10 rounded-xl" />
                <div>
                  <h3 className="font-bold text-base text-[#11181C] dark:text-white">FitMe Ecosystem</h3>
                  <span className="text-xs text-[#5B6471] dark:text-[#9AA89E]">Sindulis Innovative Solutions</span>
                </div>
              </div>
              <div className="pt-2 text-xs text-[#5B6471] dark:text-[#9AA89E] leading-relaxed border-t border-slate-100 dark:border-white/10 space-y-2">
                <p>
                  <strong>Headquarters:</strong> Sindulis Innovative Solutions
                </p>
                <p>
                  <strong>Official Contact:</strong>{' '}
                  <a href="mailto:support@fitme.sindulis.com" className="text-[#1FA45B] hover:underline">
                    support@fitme.sindulis.com
                  </a>
                </p>
                <p>
                  <strong>App Platform:</strong> Android Native (Health Connect & Google Play Services Architecture)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="py-16 sm:py-24 bg-[#FBFDFB] dark:bg-[#151B17] border-t border-slate-200/80 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1FA45B]">
              Core Principles
            </h2>
            <p className="text-3xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
              What sets FitMe apart.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8">
            {PILLARS.map((p, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl bg-white dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 space-y-3 shadow-xs"
              >
                <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center font-bold text-[#1FA45B]">
                  {i + 1}
                </div>
                <h3 className="text-xl font-bold text-[#11181C] dark:text-white">
                  {p.title}
                </h3>
                <p className="text-sm text-[#5B6471] dark:text-[#9AA89E] leading-relaxed">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              to="/download"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-[#1FA45B] hover:bg-[#178A4C] text-white font-bold text-sm shadow-md transition-all"
            >
              <span>Download FitMe Now</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
