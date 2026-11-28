import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { WebsiteLayout } from '../WebsiteLayout';

interface FeatureDetail {
  id: string;
  category: string;
  title: string;
  headline: string;
  description: string;
  benefits: string[];
  specs: { label: string; value: string }[];
  screenshot: string;
  tag: string;
}

const FEATURES: FeatureDetail[] = [
  {
    id: 'activity',
    category: 'Motion & Telemetry',
    title: 'Activity & Step Counting',
    headline: 'Continuous, battery-optimized hardware sensor tracking.',
    description: 'FitMe syncs directly with the Android Health Connect framework and hardware step detector sensors. Steps, active burn, cadence, and distance update in real time with background WorkManager synchronization.',
    benefits: [
      'Certified Google Health Connect native integration',
      'Hardware sensor fallback (ACTIVITY_RECOGNITION) if Health Connect is unavailable',
      'Persistent background sync when the screen is locked',
      'Adaptive daily step goals that adjust to your personal activity curve',
    ],
    specs: [
      { label: 'Sync Mechanism', value: 'Health Connect + Hardware Sensor' },
      { label: 'Background Sync', value: 'WorkManager Android Service' },
      { label: 'Battery Impact', value: '< 1.2% per day' },
    ],
    screenshot: '/screenshots/phone-3-steps.png',
    tag: 'Core Health Telemetry',
  },
  {
    id: 'heart-rate',
    category: 'Cardiovascular Vitals',
    title: 'Heart Rate & Cardio Zones',
    headline: 'Real-time telemetry and resting heart rate trends.',
    description: 'Monitor resting heart rate, workout heart rate zones, and cardiovascular recovery. FitMe synchronizes with connected Wear OS watches, Bluetooth heart rate monitors, and smart bands via Health Connect.',
    benefits: [
      'Automatic resting heart rate baselines calculated during rest',
      'Real-time cardio zone categorization (Warm-up, Fat Burn, Cardio, Peak)',
      'High/low resting heart rate notifications',
      'Full longitudinal trend graphs over days, weeks, and months',
    ],
    specs: [
      { label: 'Supported Protocols', value: 'Health Connect, BLE Heart Rate Service' },
      { label: 'Data Precision', value: 'BPM with 1-second resolution' },
      { label: 'Privacy Tier', value: 'On-device encrypted vitals' },
    ],
    screenshot: '/screenshots/phone-1-home.png',
    tag: 'Cardio Vitals',
  },
  {
    id: 'food-macros',
    category: 'Nutritional Science',
    title: 'Food & Macro Nutrition Tracker',
    headline: 'Instant calorie budgeting and macro balance breakdown.',
    description: 'Log meals in seconds with our curated nutritional database tailored for global and regional Indian cuisine. Get exact protein, carb, fat, fiber, and micronutrient ratios with visual energy distribution curves.',
    benefits: [
      'Pre-calculated macronutrient targets based on your goal (cut, maintain, lean bulk)',
      'Fast search with regional foods (dal, roti, idli, paneer, chicken breast, oats)',
      'Custom recipe creation and quick calorie logging',
      'Automated daily deficit/surplus analysis',
    ],
    specs: [
      { label: 'Database Engine', value: 'Verified nutrition database + offline cache' },
      { label: 'Macro Split', value: 'Protein, Carbohydrates, Fats & Fiber' },
      { label: 'Logging Speed', value: '< 5 seconds per meal' },
    ],
    screenshot: '/screenshots/phone-2-food.png',
    tag: 'Nutrition & Macros',
  },
  {
    id: 'water',
    category: 'Hydration',
    title: 'Water & Hydration Tracking',
    headline: 'Smart hydration alerts and quick one-tap logging.',
    description: 'Track daily fluid intake based on your body weight, climate, and daily workout expenditure. Quick one-tap water logging widgets make hitting your 2.5L to 4L hydration targets effortless.',
    benefits: [
      'Dynamically adjusted daily water quota based on exercise intensity',
      'Quick add buttons (+250ml, +500ml, +750ml, +1L)',
      'Smart hydration reminders spaced evenly throughout waking hours',
      'Hydration streak tracking to build permanent health habits',
    ],
    specs: [
      { label: 'Default Target', value: '3,000 ml (Customizable)' },
      { label: 'Quick Logging', value: 'One-tap widget' },
      { label: 'Smart Alerts', value: 'Custom scheduled notifications' },
    ],
    screenshot: '/screenshots/phone-7-water.png',
    tag: 'Hydration',
  },
  {
    id: 'sleep',
    category: 'Recovery',
    title: 'Sleep & Circadian Rhythm',
    headline: 'Understand sleep quality, duration, and restorative recovery.',
    description: 'Sync sleep sessions recorded by smartwatches and sleep rings directly through Health Connect. View sleep efficiency, deep/REM stages, awake periods, and bedtime consistency charts.',
    benefits: [
      'Comprehensive sleep duration vs. bedtime consistency comparison',
      'Integration with Google Health Connect sleep stage telemetry',
      'Morning recovery rating to adjust workout intensity for the day',
      'Zero manual entry required when paired with wearable devices',
    ],
    specs: [
      { label: 'Metrics', value: 'Duration, Stages, Sleep Score' },
      { label: 'Hardware Support', value: 'Samsung Galaxy Watch, Pixel Watch, Garmin' },
      { label: 'Recovery Integration', value: 'Adapts workout strain' },
    ],
    screenshot: '/screenshots/phone-8-sleep.png',
    tag: 'Sleep & Recovery',
  },
  {
    id: 'weight',
    category: 'Body Composition',
    title: 'Weight & Body Composition',
    headline: 'Long-term trend smoothing and milestone achievement.',
    description: 'Log weight and body fat percentage with moving-average trendlines that filter out daily water weight fluctuations. Visualize your true body composition changes over 30, 90, and 365 days.',
    benefits: [
      'Exponential moving average to eliminate day-to-day water weight noise',
      'BMI and body composition category indicators',
      'Target weight projection timeline with realistic weekly pacing',
      'Photo progress log stored securely in your private encrypted storage',
    ],
    specs: [
      { label: 'Trend Smoothing', value: '7-day and 30-day moving average' },
      { label: 'Units', value: 'Kilograms (kg) and Pounds (lbs)' },
      { label: 'Sync', value: 'Smart scale sync via Health Connect' },
    ],
    screenshot: '/screenshots/phone-1-home.png',
    tag: 'Weight & Metrics',
  },
  {
    id: 'workouts',
    category: 'Exercise & Training',
    title: 'Workouts & GPS Route Maps',
    headline: 'Custom training routines and live outdoor route telemetry.',
    description: 'Track indoor gym sessions with rep and set counters, or head outdoors with GPS route recording. Real-time pace, heart rate zone telemetry, elevation gain, and active calorie burn.',
    benefits: [
      'Comprehensive exercise library for gym, home workouts, HIIT, and cardio',
      'Live GPS map route drawing with split pace indicators',
      'Rest timers between sets with audio and haptic cues',
      'Auto-save to Health Connect exercise sessions',
    ],
    specs: [
      { label: 'GPS Accuracy', value: 'High-precision location tracking' },
      { label: 'Workout Modes', value: 'Gym, Running, Walking, Cycling, Yoga' },
      { label: 'Haptic Feedback', value: 'Rest timer completion alerts' },
    ],
    screenshot: '/screenshots/phone-4-route.png',
    tag: 'GPS & Workouts',
  },
  {
    id: 'ai-coach',
    category: 'Intelligent Guidance',
    title: 'AI Health & Fitness Coach',
    headline: 'Context-aware health advice trained on your personal data.',
    description: 'Your on-device AI coach analyzes your sleep, nutrition balance, workout volume, and step targets to offer personalized, encouraging insights and actionable daily adjustments.',
    benefits: [
      'Understands your specific dietary restrictions, allergies, and workout preferences',
      'Suggests meal modifications when you are short on protein or over on calories',
      'Dynamically scales workout difficulty based on sleep recovery scores',
      'Private conversational chat to answer fitness and health queries',
    ],
    specs: [
      { label: 'Engine', value: 'Private AI logic via Firebase Cloud Functions' },
      { label: 'Context Horizon', value: 'Personalized 7-day health telemetry' },
      { label: 'Language', value: 'Supports 10 global languages' },
    ],
    screenshot: '/screenshots/phone-9-coach.png',
    tag: 'AI Intelligence',
  },
  {
    id: 'insights',
    category: 'Analytics',
    title: 'Progress Insights & Reports',
    headline: 'Clear, motivating analytics that prove your consistency.',
    description: 'Weekly and monthly health summaries that highlight calorie adherence, workout consistency streaks, step volume, and resting heart rate improvements.',
    benefits: [
      'Weekly report cards summarizing achievements and areas for improvement',
      'Interactive vector charts with pan, zoom, and metric cross-correlation',
      'Streak counter to celebrate daily consistency and positive habit loops',
      'Exportable health summaries for your personal trainer or doctor',
    ],
    specs: [
      { label: 'Report Cadence', value: 'Daily, Weekly, Monthly, All-time' },
      { label: 'Chart Visuals', value: 'Multi-metric correlation curves' },
      { label: 'Export Format', value: 'Structured summary export' },
    ],
    screenshot: '/screenshots/phone-10-insights.png',
    tag: 'Health Analytics',
  },
  {
    id: 'reminders',
    category: 'Habit Formation',
    title: 'Smart Reminders & Push Channels',
    headline: 'Timely reminders that keep you focused without notification fatigue.',
    description: 'Custom Android notification channels tailored for habit building. Receive meal logging reminders, workout alarms, and walk prompts with actionable notification quick buttons.',
    benefits: [
      'Dedicated Android 13+ Notification Channels (Coach, Reminders, Vitals)',
      'Actionable notifications that let you log water or acknowledge workouts directly',
      'Respects battery optimization while delivering critical alarms on time',
      'Custom quiet hours during sleep or focus windows',
    ],
    specs: [
      { label: 'Notification Service', value: 'Firebase Cloud Messaging (FCM)' },
      { label: 'Android Channels', value: 'Reminders, Coach, Health Alerts' },
      { label: 'Battery Friendly', value: 'Exact alarm permission when needed' },
    ],
    screenshot: '/screenshots/phone-6-devices.png',
    tag: 'Smart Notifications',
  },
];

export function FeaturesPage() {
  const location = useLocation();

  // Scroll to hash anchor if present
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location.hash]);

  return (
    <WebsiteLayout
      title="FitMe Features – Comprehensive Health & Fitness Tracking"
      description="Explore the complete suite of FitMe features: Health Connect step sync, continuous heart rate, macro nutrition, sleep recovery, GPS route mapping, and AI coaching."
    >
      {/* Header Banner */}
      <section className="pt-8 pb-14 bg-gradient-to-b from-[#F0FDF4]/60 to-white dark:from-[#152018] dark:to-[#111613]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1FA45B]/10 text-[#1FA45B] text-xs font-bold uppercase tracking-wider">
            All Features Directory
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
            Designed for health, engineered for precision.
          </h1>
          <p className="text-base sm:text-lg text-[#5B6471] dark:text-[#9AA89E] max-w-2xl mx-auto">
            Discover the 10 core health pillars built directly into the FitMe native Android app.
          </p>

          {/* Quick Anchor Navigation Strip */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            {FEATURES.map((feat) => (
              <a
                key={feat.id}
                href={`#${feat.id}`}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[#5B6471] dark:text-slate-300 hover:text-[#1FA45B] hover:border-[#1FA45B]/30 hover:bg-[#F0FDF4] transition-all"
              >
                {feat.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Deep Dive Sections */}
      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {FEATURES.map((feat, index) => {
          const isReversed = index % 2 === 1;
          return (
            <section
              key={feat.id}
              id={feat.id}
              className="py-16 sm:py-24 scroll-mt-24"
            >
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center ${
                    isReversed ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* Text Column */}
                  <div
                    className={`lg:col-span-7 space-y-6 ${
                      isReversed ? 'lg:order-2' : 'lg:order-1'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-[#F0FDF4] dark:bg-[#1FA45B]/15 text-[#1FA45B] text-xs font-bold uppercase tracking-wider">
                        {feat.tag}
                      </span>
                      <span className="text-xs text-[#5B6471] dark:text-slate-400 font-medium">
                        {feat.category}
                      </span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
                      {feat.title}
                    </h2>

                    <p className="text-lg font-medium text-[#1FA45B]">
                      {feat.headline}
                    </p>

                    <p className="text-base text-[#5B6471] dark:text-[#9AA89E] leading-relaxed">
                      {feat.description}
                    </p>

                    {/* Benefits List */}
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#11181C] dark:text-white">
                        Key Capabilities
                      </h3>
                      <ul className="space-y-2">
                        {feat.benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-[#5B6471] dark:text-slate-300">
                            <svg className="h-5 w-5 text-[#1FA45B] shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Technical Specs Strip */}
                    <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-100 dark:border-white/10">
                      {feat.specs.map((s, i) => (
                        <div key={i} className="p-3 rounded-xl bg-[#FBFDFB] dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                          <div className="text-[11px] font-semibold text-[#8C96A5] uppercase tracking-wider">
                            {s.label}
                          </div>
                          <div className="text-xs font-bold text-[#11181C] dark:text-white mt-0.5">
                            {s.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Screenshot Phone Frame Column */}
                  <div
                    className={`lg:col-span-5 flex justify-center ${
                      isReversed ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <div className="w-65 sm:w-70 rounded-[40px] border-[8px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden aspect-[9/19.5]">
                      <img
                        src={feat.screenshot}
                        alt={`${feat.title} interface screenshot`}
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <section className="py-16 bg-[#F0FDF4] dark:bg-[#152018] border-t border-[#1FA45B]/20 text-center">
        <div className="mx-auto max-w-4xl px-4 space-y-5">
          <h2 className="text-3xl font-extrabold text-[#11181C] dark:text-white">
            Experience every feature natively on your phone.
          </h2>
          <p className="text-base text-[#5B6471] dark:text-[#9AA89E]">
            Download the official FitMe v2.0.1 release APK directly and start tracking in minutes.
          </p>
          <div className="pt-2">
            <Link
              to="/download"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl bg-[#1FA45B] hover:bg-[#178A4C] text-white font-bold text-sm shadow-md transition-all"
            >
              <span>Download FitMe for Android</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
