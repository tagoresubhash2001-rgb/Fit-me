import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WebsiteLayout } from '../WebsiteLayout';

const SCREENSHOTS = [
  {
    id: 'home',
    src: '/screenshots/phone-1-home.png',
    title: 'Daily Activity & Energy Rings',
    caption: 'Track daily steps, active calorie burn, and real-time exercise telemetry.',
  },
  {
    id: 'food',
    src: '/screenshots/phone-2-food.png',
    title: 'Diet & Macro Nutrition',
    caption: 'Log meals with instant protein, carbs, fat, and micronutrient breakdowns.',
  },
  {
    id: 'steps',
    src: '/screenshots/phone-3-steps.png',
    title: 'Health Connect Telemetry',
    caption: 'Continuous background step counting with hardware sensors and WorkManager.',
  },
  {
    id: 'route',
    src: '/screenshots/phone-4-route.png',
    title: 'Live GPS Workouts & Routes',
    caption: 'Track distance, pace, elevation, and outdoor running or cycling paths.',
  },
  {
    id: 'workouts',
    src: '/screenshots/phone-5-workouts.png',
    title: 'Customized Training Routines',
    caption: 'Tailored strength, HIIT, and endurance sessions with rep and set tracking.',
  },
  {
    id: 'coach',
    src: '/screenshots/phone-9-coach.png',
    title: 'Intelligent AI Fitness Coach',
    caption: 'Personalized wellness tips, workout adaptations, and nutritional guidance.',
  },
  {
    id: 'water',
    src: '/screenshots/phone-7-water.png',
    title: 'Hydration & Daily Habit Tracking',
    caption: 'Smart water logging, sleep recovery insights, and weight progress charts.',
  },
  {
    id: 'insights',
    src: '/screenshots/phone-10-insights.png',
    title: 'Long-Term Analytics & Milestones',
    caption: 'Detailed trend analysis, body composition metrics, and goal celebration.',
  },
];

const TRUST_STATS = [
  { value: '100%', label: 'Private & On-Device', desc: 'Zero selling of sensitive biometric health telemetry' },
  { value: 'Native', label: 'Health Connect Client', desc: 'Certified Google Health Connect integration' },
  { value: '10', label: 'Global Languages', desc: 'English, Hindi, Telugu, Tamil, Arabic, Spanish & more' },
  { value: '24/7', label: 'Background Sync', desc: 'Continuous WorkManager step synchronization' },
];

export function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('desktop');

  // Device detection
  useEffect(() => {
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) setDeviceType('android');
    else if (/iPad|iPhone|iPod/.test(ua)) setDeviceType('ios');
    else setDeviceType('desktop');
  }, []);

  return (
    <WebsiteLayout
      title="FitMe – For a Healthier Life"
      description="FitMe is your native health companion for Android. Accurate Health Connect step counting, heart rate telemetry, diet and macro nutrition tracking, and AI coaching."
    >
      {/* ========================================================
          HERO SECTION
      ======================================================== */}
      <section className="relative pt-8 pb-20 lg:pt-14 lg:pb-32 overflow-hidden">
        {/* Soft brand green background gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[520px] pointer-events-none opacity-40 dark:opacity-20">
          <div className="w-[600px] h-[450px] mx-auto rounded-full bg-gradient-to-tr from-[#1FA45B]/25 to-emerald-200/30 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0FDF4] dark:bg-[#1FA45B]/15 border border-[#1FA45B]/25 text-xs font-semibold text-[#1FA45B] shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-[#1FA45B] animate-pulse" />
                <span>FitMe Native Android v2.0.1 Live Release</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#11181C] dark:text-white leading-[1.12]">
                Your health journey,{' '}
                <span className="text-[#1FA45B] block sm:inline">
                  engineered for precision.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-[#5B6471] dark:text-[#9AA89E] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                FitMe combines certified Health Connect hardware telemetry, real-time heart rate analytics, macro nutrition tracking, and an adaptive AI fitness coach into one fast, private native app.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/download"
                  className={`inline-flex items-center justify-center gap-2.5 h-13 px-7 rounded-2xl text-base font-bold shadow-md transition-all active:scale-95 ${
                    deviceType === 'android' || deviceType === 'desktop'
                      ? 'bg-[#1FA45B] hover:bg-[#178A4C] text-white shadow-[#1FA45B]/25 hover:shadow-lg'
                      : 'border-2 border-[#1FA45B] text-[#1FA45B] hover:bg-[#F0FDF4]'
                  }`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003 0-.5516.4482-1.0003.9993-1.0003.5517 0 .9994.4487.9994 1.0003 0 .5517-.4477 1.0003-.9994 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003 0-.5516.4482-1.0003.9993-1.0003.5517 0 .9994.4487.9994 1.0003 0 .5517-.4477 1.0003-.9994 1.0003m11.4045-6.02l1.9967-3.4583a.416.416 0 00-.152-.5676.416.416 0 00-.568.152l-2.0223 3.503C15.5902 8.4116 13.8533 8.125 12 8.125c-1.8533 0-3.5902.2866-5.136.8258L4.8418 5.4478a.416.416 0 00-.568-.152.416.416 0 00-.152.5676l1.9967 3.4583C2.688 11.2338.3438 14.8113 0 19.0625h24c-.3438-4.2512-2.688-7.8287-6.1185-9.7411" />
                  </svg>
                  <span>Download for Android</span>
                </Link>

                <Link
                  to="/download#ios-waitlist"
                  className={`inline-flex items-center justify-center gap-2 h-13 px-6 rounded-2xl text-base font-semibold transition-all ${
                    deviceType === 'ios'
                      ? 'bg-[#1FA45B] hover:bg-[#178A4C] text-white shadow-md'
                      : 'border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-[#11181C] dark:text-white'
                  }`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.9.04-2.02.61-2.66 1.36-.57.65-1.06 1.73-0.93 2.76 1.02.08 2.06-.5 2.67-1.25z" />
                  </svg>
                  <span>iOS (Coming Soon)</span>
                </Link>
              </div>

              {/* Direct APK specs pill */}
              <div className="pt-2 flex items-center justify-center lg:justify-start gap-4 text-xs text-[#5B6471] dark:text-[#9AA89E]">
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-[#1FA45B]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  v2.0.1 (11.4 MB)
                </span>
                <span>•</span>
                <span>Direct Signed APK</span>
                <span>•</span>
                <span>No Store Login Required</span>
              </div>
            </div>

            {/* Right Phone Mockup Column */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[320px] sm:max-w-[340px]">
                {/* Glow ring */}
                <div className="absolute inset-0 bg-[#1FA45B]/20 rounded-[50px] blur-2xl transform scale-105" />

                {/* Phone Frame */}
                <div className="relative rounded-[46px] border-[10px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden aspect-[9/19.5]">
                  {/* Dynamic Island on Phone Mockup */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-20 flex items-center justify-end px-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>

                  {/* Screen Content Image */}
                  <img
                    src="/screenshots/phone-1-home.png"
                    alt="FitMe Native Application Dashboard"
                    className="w-full h-full object-cover object-top"
                    loading="eager"
                  />
                </div>

                {/* Floating Metric Pill 1 */}
                <div className="absolute -left-6 top-1/4 p-3 rounded-2xl bg-white/95 dark:bg-[#18201A]/95 shadow-xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md flex items-center gap-3 animate-bounce [animation-duration:5s]">
                  <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center text-[#1FA45B]">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5B6471] font-medium">Daily Steps</div>
                    <div className="text-sm font-bold text-[#11181C] dark:text-white">8,420 / 10,000</div>
                  </div>
                </div>

                {/* Floating Metric Pill 2 */}
                <div className="absolute -right-6 bottom-1/4 p-3 rounded-2xl bg-white/95 dark:bg-[#18201A]/95 shadow-xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md flex items-center gap-3 animate-bounce [animation-duration:6s] [animation-delay:1s]">
                  <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5B6471] font-medium">Heart Rate</div>
                    <div className="text-sm font-bold text-[#11181C] dark:text-white">68 bpm (Resting)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          TRUST STRIP
      ======================================================== */}
      <section className="border-y border-slate-200/80 dark:border-white/10 bg-[#FBFDFB] dark:bg-[#151B17] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {TRUST_STATS.map((stat, i) => (
              <div key={i} className="text-center sm:text-left space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#1FA45B] tracking-tight">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-[#11181C] dark:text-white">
                  {stat.label}
                </div>
                <div className="text-xs text-[#5B6471] dark:text-[#9AA89E]">
                  {stat.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          FEATURES HIGHLIGHT GRID (No pricing, real features)
      ======================================================== */}
      <section className="py-20 lg:py-28 bg-white dark:bg-[#111613]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1FA45B]">
              Native Android Architecture
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
              Built natively for battery life, accuracy, and total data privacy.
            </p>
            <p className="text-base text-[#5B6471] dark:text-[#9AA89E]">
              Unlike web trackers that halt when your screen turns off, FitMe taps into Android hardware sensors and Google Health Connect for zero-lag background telemetry.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Steps & Vitals */}
            <div className="p-8 rounded-3xl bg-[#FBFDFB] dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 space-y-4 hover:border-[#1FA45B]/40 transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-[#F0FDF4] dark:bg-[#1FA45B]/20 flex items-center justify-center text-[#1FA45B]">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#11181C] dark:text-white">
                Step & Health Connect Telemetry
              </h3>
              <p className="text-sm text-[#5B6471] dark:text-[#9AA89E] leading-relaxed">
                Seamless background sync with Health Connect and device motion sensors. Accurate distance, active calorie expenditure, and cadence tracking.
              </p>
              <Link to="/features#activity" className="text-xs font-semibold text-[#1FA45B] hover:underline inline-flex items-center gap-1">
                Explore Step Telemetry →
              </Link>
            </div>

            {/* Card 2: Food & Macros */}
            <div className="p-8 rounded-3xl bg-[#FBFDFB] dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 space-y-4 hover:border-[#1FA45B]/40 transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-[#F0FDF4] dark:bg-[#1FA45B]/20 flex items-center justify-center text-[#1FA45B]">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#11181C] dark:text-white">
                Nutritional Macro Tracking
              </h3>
              <p className="text-sm text-[#5B6471] dark:text-[#9AA89E] leading-relaxed">
                Log breakfast, lunch, dinner and snacks in seconds. Instant protein, carb, and healthy fat distribution curves with regional Indian and global foods.
              </p>
              <Link to="/features#food-macros" className="text-xs font-semibold text-[#1FA45B] hover:underline inline-flex items-center gap-1">
                Explore Diet & Macros →
              </Link>
            </div>

            {/* Card 3: AI Fitness Coach */}
            <div className="p-8 rounded-3xl bg-[#FBFDFB] dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 space-y-4 hover:border-[#1FA45B]/40 transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-[#F0FDF4] dark:bg-[#1FA45B]/20 flex items-center justify-center text-[#1FA45B]">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#11181C] dark:text-white">
                Adaptive AI Coach & Insights
              </h3>
              <p className="text-sm text-[#5B6471] dark:text-[#9AA89E] leading-relaxed">
                Intelligent workout adaptations and sleep recovery correlations. Ask health questions, generate custom workout splits, and stay motivated.
              </p>
              <Link to="/features#ai-coach" className="text-xs font-semibold text-[#1FA45B] hover:underline inline-flex items-center gap-1">
                Explore AI Coach →
              </Link>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/features"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#1FA45B] hover:text-[#178A4C] transition-colors"
            >
              <span>View all 10 core health capabilities in detail</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          SCREENSHOTS CAROUSEL (Strictly Real App Screens, Zero Pricing)
      ======================================================== */}
      <section className="py-20 lg:py-28 bg-[#FBFDFB] dark:bg-[#151B17] border-t border-slate-200/80 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1FA45B]">
              Real App Interface
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
              Designed for clarity, speed, and real daily utility.
            </p>
            <p className="text-sm text-[#5B6471] dark:text-[#9AA89E]">
              Every screen captured directly from the live FitMe Android release with realistic health telemetry.
            </p>
          </div>

          {/* Carousel Navigation Buttons */}
          <div className="mt-10 flex items-center justify-center gap-2">
            {SCREENSHOTS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={`View screenshot ${idx + 1}: ${item.title}`}
                className={`h-2.5 transition-all rounded-full ${
                  activeSlide === idx ? 'w-8 bg-[#1FA45B]' : 'w-2.5 bg-slate-300 dark:bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Active Screenshot Display */}
          <div className="mt-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 shadow-sm">
            <div className="md:col-span-5 flex justify-center">
              <div className="w-[240px] sm:w-[260px] rounded-[36px] border-[8px] border-slate-900 bg-slate-900 shadow-xl overflow-hidden aspect-[9/19.5]">
                <img
                  src={SCREENSHOTS[activeSlide].src}
                  alt={SCREENSHOTS[activeSlide].title}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="md:col-span-7 space-y-4 text-center md:text-left">
              <span className="text-xs font-bold text-[#1FA45B] uppercase tracking-wider">
                Screen {activeSlide + 1} of {SCREENSHOTS.length}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
                {SCREENSHOTS[activeSlide].title}
              </h3>
              <p className="text-base text-[#5B6471] dark:text-[#9AA89E] leading-relaxed">
                {SCREENSHOTS[activeSlide].caption}
              </p>
              <div className="pt-4 flex items-center justify-center md:justify-start gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSlide((prev) => (prev > 0 ? prev - 1 : SCREENSHOTS.length - 1))}
                  className="h-10 w-10 rounded-full border border-slate-300 dark:border-white/20 flex items-center justify-center text-[#11181C] dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  aria-label="Previous screenshot"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlide((prev) => (prev < SCREENSHOTS.length - 1 ? prev + 1 : 0))}
                  className="h-10 w-10 rounded-full border border-slate-300 dark:border-white/20 flex items-center justify-center text-[#11181C] dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  aria-label="Next screenshot"
                >
                  →
                </button>
                <Link
                  to="/features"
                  className="ml-2 text-xs font-semibold text-[#1FA45B] hover:underline"
                >
                  Detailed feature breakdown
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          HOW IT WORKS SUMMARY
      ======================================================== */}
      <section className="py-20 lg:py-28 bg-white dark:bg-[#111613]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1FA45B]">
              Quick Onboarding
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
              Get up and running in 3 minutes.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#FBFDFB] dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 space-y-3">
              <span className="inline-flex h-8 w-8 rounded-full bg-[#1FA45B] text-white items-center justify-center font-bold text-sm">
                1
              </span>
              <h3 className="text-lg font-bold text-[#11181C] dark:text-white">
                Download Signed APK
              </h3>
              <p className="text-sm text-[#5B6471] dark:text-[#9AA89E]">
                Direct download from our verified servers. Follow our simple 3-step sideload guide to install instantly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FBFDFB] dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 space-y-3">
              <span className="inline-flex h-8 w-8 rounded-full bg-[#1FA45B] text-white items-center justify-center font-bold text-sm">
                2
              </span>
              <h3 className="text-lg font-bold text-[#11181C] dark:text-white">
                Connect Health Sensors
              </h3>
              <p className="text-sm text-[#5B6471] dark:text-[#9AA89E]">
                Grant Health Connect or device motion sensor permissions with one tap. Data remains strictly private on your phone.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FBFDFB] dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 space-y-3">
              <span className="inline-flex h-8 w-8 rounded-full bg-[#1FA45B] text-white items-center justify-center font-bold text-sm">
                3
              </span>
              <h3 className="text-lg font-bold text-[#11181C] dark:text-white">
                Achieve Daily Milestones
              </h3>
              <p className="text-sm text-[#5B6471] dark:text-[#9AA89E]">
                Log nutrition, monitor cardio telemetry, and let the AI Coach adapt your workout and habit plans in real time.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1FA45B] hover:text-[#178A4C]"
            >
              <span>Read the step-by-step setup guide</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          DOWNLOAD CTA STRIP
      ======================================================== */}
      <section className="py-16 sm:py-24 bg-[#F0FDF4] dark:bg-[#152018] border-t border-[#1FA45B]/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <img src="/favicon.svg" alt="" width={56} height={56} className="h-14 w-14 mx-auto rounded-2xl shadow-sm" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
            Start your healthier life today with FitMe.
          </h2>
          <p className="text-base sm:text-lg text-[#5B6471] dark:text-[#9AA89E] max-w-xl mx-auto">
            Experience the difference of a native Android app built for precision, privacy, and continuous battery-friendly telemetry.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/download"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-2xl bg-[#1FA45B] hover:bg-[#178A4C] text-white font-bold text-base shadow-md hover:shadow-lg transition-all"
            >
              <span>Download for Android (v2.0.1)</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V4a1 1 0 011-1z" clipRule="evenodd" />
                <path d="M4 14a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" />
              </svg>
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center justify-center h-12 px-6 rounded-2xl border border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 text-[#11181C] dark:text-white font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
