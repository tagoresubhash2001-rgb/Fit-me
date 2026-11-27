import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Download,
  Smartphone,
  Apple,
  Activity,
  Heart,
  Sparkles,
  Utensils,
  Dumbbell,
  TrendingUp,
  Bell,
  Shield,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Check,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Menu,
  X,
  Flame,
  Moon,
  Info,
  ArrowRight,
  Send,
  Loader2,
  Zap,
} from 'lucide-react';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface AndroidConfig {
  latestVersionName: string;
  latestVersionCode: number;
  minSupportedVersionCode: number;
  apkUrl: string;
  fileSizeMB: number;
  releaseNotes: string;
  releaseDate: string;
}

const DEFAULT_ANDROID_CONFIG: AndroidConfig = {
  latestVersionName: 'v2.0.1',
  latestVersionCode: 201,
  minSupportedVersionCode: 200,
  apkUrl: '/download/android',
  fileSizeMB: 24.5,
  releaseNotes: 'Precision Health Connect step sync, continuous heart rate analytics, and AI coaching updates.',
  releaseDate: 'November 26, 2026',
};

const SCREENSHOTS = [
  {
    id: 'home',
    src: '/screenshots/phone-1-home.png',
    title: 'Daily Dashboard & Activity Rings',
    caption: 'Track daily steps, active calorie burn, and real-time activity metrics.',
  },
  {
    id: 'food',
    src: '/screenshots/phone-2-food.png',
    title: 'Diet & Macro Nutrition Tracker',
    caption: 'Log meals with instant protein, carbs, fat, and micronutrient breakdowns.',
  },
  {
    id: 'steps',
    src: '/screenshots/phone-3-steps.png',
    title: 'Health Connect Step Telemetry',
    caption: 'Continuous background step counting with hardware and cloud sensors.',
  },
  {
    id: 'route',
    src: '/screenshots/phone-4-route.png',
    title: 'Live GPS Workout & Route Map',
    caption: 'Track distance, pace, elevation, and outdoor running or cycling paths.',
  },
  {
    id: 'plans',
    src: '/screenshots/phone-5-plans.png',
    title: 'Customized Training & Goal Plans',
    caption: 'Tailored strength, HIIT, and endurance routines with AI adaptations.',
  },
  {
    id: 'devices',
    src: '/screenshots/phone-6-devices.png',
    title: 'Connected Health Hub',
    caption: 'Sync seamlessly with Health Connect, Wear OS, and smart wearables.',
  },
];

export default function LandingScreen() {
  const [searchParams] = useSearchParams();
  const showCustomerBanner = searchParams.get('ref') === 'web_app' || searchParams.get('redirect') === 'mobile_only';

  const [device, setDevice] = useState<'android' | 'ios' | 'desktop'>('desktop');
  const [androidConfig, setAndroidConfig] = useState<AndroidConfig>(DEFAULT_ANDROID_CONFIG);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'steps' | 'heart' | 'coach' | 'diet'>('steps');
  const [currentSlide, setCurrentSlide] = useState(0);

  // iOS Waitlist Form
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [iosEmail, setIosEmail] = useState('');
  const [iosSubmitted, setIosSubmitted] = useState(false);
  const [iosSubmitting, setIosSubmitting] = useState(false);
  const [iosError, setIosError] = useState<string | null>(null);

  // FAQ expanded state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Pricing from Firestore
  const [pricingText, setPricingText] = useState<{
    intro: string;
    trial: string;
    premiumPrice: string;
    proPrice: string;
  }>({
    intro: 'First 7 Days Free — All Features Unlocked',
    trial: '30-Day Risk-Free Full Access Trial',
    premiumPrice: '₹199 / month',
    proPrice: '₹399 / month',
  });

  // Detect Device
  useEffect(() => {
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) {
      setDevice('android');
    } else if (/iPad|iPhone|iPod/.test(ua)) {
      setDevice('ios');
    } else {
      setDevice('desktop');
    }
  }, []);

  // Fetch Firestore app_config/android & pricing
  useEffect(() => {
    getDoc(doc(db(), 'app_config/android'))
      .then((snap) => {
        if (snap.exists()) {
          setAndroidConfig((prev) => ({ ...prev, ...(snap.data() as Partial<AndroidConfig>) }));
        }
      })
      .catch(() => undefined);

    getDoc(doc(db(), 'appConfig/pricing'))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          if (d.trialDays) {
            setPricingText((prev) => ({
              ...prev,
              trial: `${d.trialDays}-Day Risk-Free Full Access Trial`,
            }));
          }
        }
      })
      .catch(() => undefined);
  }, []);

  const handleIosWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iosEmail || !iosEmail.includes('@')) {
      setIosError('Please enter a valid email address.');
      return;
    }
    setIosSubmitting(true);
    setIosError(null);
    try {
      await addDoc(collection(db(), 'ios_waitlist'), {
        email: iosEmail.trim().toLowerCase(),
        createdAt: serverTimestamp(),
        device: 'iOS',
        userAgent: navigator.userAgent,
        source: 'landing_page',
      });
      setIosSubmitted(true);
    } catch (err) {
      console.error('Waitlist error:', err);
      setIosSubmitted(true); // Graceful recovery
    } finally {
      setIosSubmitting(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SCREENSHOTS.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SCREENSHOTS.length) % SCREENSHOTS.length);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 selection:bg-[#1FA45B] selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Customer Web Notice Banner */}
      {showCustomerBanner && (
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-4 py-3 text-center text-xs sm:text-sm font-semibold text-white shadow-md">
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-2">
            <Smartphone className="h-4 w-4 shrink-0" />
            <span>FitMe is now available as a mobile app for the best experience. Download the official Android APK below!</span>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070B14]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 transition-transform hover:scale-105">
            <img src="/favicon.svg" alt="FitMe" width={34} height={34} className="h-8.5 w-8.5 rounded-xl shadow-sm" />
            <span className="text-xl font-bold tracking-tight text-white">FitMe</span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#how-it-works" className="transition hover:text-white">How It Works</a>
            <a href="#screenshots" className="transition hover:text-white">Screenshots</a>
            <a href="#pricing" className="transition hover:text-white">Access</a>
            <a href="#download" className="transition hover:text-white">Download</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </nav>

          {/* Header Action */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="#download"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1FA45B] px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>Get the App</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-[#0A0F1D] px-6 py-5">
            <nav className="flex flex-col gap-4 text-base font-medium text-slate-300">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">How It Works</a>
              <a href="#screenshots" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">Screenshots</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">Access</a>
              <a href="#download" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">Download</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-white">FAQ</a>
              <div className="pt-2">
                <a
                  href="#download"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1FA45B] text-sm font-semibold text-white"
                >
                  <Download className="h-4 w-4" />
                  <span>Download APK Now</span>
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[600px] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline & CTA */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Next-Generation AI Health &amp; Fitness</span>
              </div>

              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                FitMe – For a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Healthier, Stronger</span> Life
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Precision step tracking, continuous cardiovascular monitoring, intelligent meal logging, and 24/7 AI personal coaching. Engineered natively for real background synchronization.
              </p>

              {/* Download Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {/* Android Button */}
                <a
                  href="/download/android"
                  className={`flex h-13 w-full sm:w-auto items-center justify-center gap-3 rounded-2xl px-7 text-sm font-semibold shadow-xl transition active:scale-95 ${
                    device === 'android' || device === 'desktop'
                      ? 'bg-[#1FA45B] hover:bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <Smartphone className="h-5 w-5" />
                  <div className="text-left">
                    <span className="block text-[10px] uppercase tracking-wider text-white/80 font-medium">Direct Install</span>
                    <span className="text-sm font-bold">Download for Android</span>
                  </div>
                </a>

                {/* iOS Button */}
                <button
                  type="button"
                  onClick={() => setIosModalOpen(true)}
                  className={`flex h-13 w-full sm:w-auto items-center justify-center gap-3 rounded-2xl px-6 text-sm font-semibold transition active:scale-95 ${
                    device === 'ios'
                      ? 'bg-slate-800 hover:bg-slate-700 text-white ring-2 ring-emerald-400/50'
                      : 'border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Apple className="h-5 w-5" />
                  <div className="text-left">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-medium">Coming Soon</span>
                    <span className="text-sm font-bold">Download for iOS</span>
                  </div>
                </button>
              </div>

              {/* Version & Security badge */}
              <div className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5 text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Official Release {androidConfig.latestVersionName} ({androidConfig.fileSizeMB} MB)
                </span>
                <span>•</span>
                <span>Cryptographically Signed APK</span>
                <span>•</span>
                <span>No Google Play Lag</span>
              </div>
            </div>

            {/* Right Column: Animated Phone Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[340px]">
                {/* Floating Achievement Badges */}
                <div className="absolute -top-4 -left-6 z-20 hidden sm:flex items-center gap-2.5 rounded-2xl border border-slate-800 bg-[#0D1527]/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md animate-[float_4s_ease-in-out_infinite]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Daily Target</div>
                    <div className="text-xs font-bold text-white">10,482 Steps Reached</div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-6 z-20 hidden sm:flex items-center gap-2.5 rounded-2xl border border-slate-800 bg-[#0D1527]/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md animate-[float_5s_ease-in-out_infinite]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                    <Heart className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Resting Heart Rate</div>
                    <div className="text-xs font-bold text-white">68 BPM · Optimal Zone</div>
                  </div>
                </div>

                {/* Phone Hardware Mockup Outer Shell */}
                <div className="relative rounded-[42px] border-[6px] border-slate-700 bg-slate-900 p-2 shadow-2xl shadow-emerald-500/10">
                  {/* Dynamic Island / Camera Notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 h-4 w-24 rounded-full bg-slate-950" />

                  {/* Phone Screen Display */}
                  <div className="overflow-hidden rounded-[34px] bg-[#0A0F1D] text-white">
                    {/* Screen Navigation Tabs */}
                    <div className="grid grid-cols-4 border-b border-slate-800/80 bg-slate-900/60 p-1 text-[11px] font-medium text-slate-400 pt-7">
                      <button
                        type="button"
                        onClick={() => setActiveTab('steps')}
                        className={`py-1.5 rounded-lg transition ${activeTab === 'steps' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'hover:text-white'}`}
                      >
                        Steps
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('heart')}
                        className={`py-1.5 rounded-lg transition ${activeTab === 'heart' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'hover:text-white'}`}
                      >
                        Heart
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('coach')}
                        className={`py-1.5 rounded-lg transition ${activeTab === 'coach' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'hover:text-white'}`}
                      >
                        Coach
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('diet')}
                        className={`py-1.5 rounded-lg transition ${activeTab === 'diet' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'hover:text-white'}`}
                      >
                        Diet
                      </button>
                    </div>

                    {/* Tab 1: Steps Ring */}
                    {activeTab === 'steps' && (
                      <div className="p-5 text-center animate-[fade-in_200ms_ease-out]">
                        <div className="text-xs text-slate-400 font-medium">Daily Step Target</div>
                        {/* Ring Visual */}
                        <div className="relative mx-auto my-4 flex h-36 w-36 items-center justify-center">
                          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="#1E293B" strokeWidth="8" fill="transparent" />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="#1FA45B"
                              strokeWidth="8"
                              strokeDasharray="251.2"
                              strokeDashoffset="35"
                              strokeLinecap="round"
                              fill="transparent"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-2xl font-extrabold text-white">10,482</span>
                            <span className="text-[10px] text-slate-400">/ 10,000 steps</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-3 text-left">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Distance</span>
                            <span className="text-xs font-bold text-white">7.8 km</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Calories</span>
                            <span className="text-xs font-bold text-white">620 kcal</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Active Time</span>
                            <span className="text-xs font-bold text-white">64 min</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Heart Rate */}
                    {activeTab === 'heart' && (
                      <div className="p-5 text-center animate-[fade-in_200ms_ease-out]">
                        <div className="text-xs text-slate-400 font-medium">Continuous Cardio Telemetry</div>
                        <div className="my-4 flex items-center justify-center gap-2">
                          <Heart className="h-6 w-6 text-rose-500 animate-pulse" />
                          <span className="text-3xl font-extrabold text-white">68</span>
                          <span className="text-xs text-slate-400">BPM</span>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left text-xs space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Resting Pulse:</span>
                            <span className="font-semibold text-emerald-400">58 BPM (Excellent)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Heart Rate Variability:</span>
                            <span className="font-semibold text-white">64 ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Cardio Health Zone:</span>
                            <span className="font-semibold text-teal-400">Zone 2 Aerobic</span>
                          </div>
                        </div>
                        <p className="mt-3 text-[10px] text-slate-400">Synced via Health Connect from wearable sensor</p>
                      </div>
                    )}

                    {/* Tab 3: AI Coach */}
                    {activeTab === 'coach' && (
                      <div className="p-4 text-left animate-[fade-in_200ms_ease-out] space-y-3">
                        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                          <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">J</div>
                          <div>
                            <div className="text-xs font-semibold text-white">Jai · AI Fitness Coach</div>
                            <div className="text-[9px] text-emerald-400 font-medium">Active · Personalized Plan</div>
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-800/80 p-2.5 text-xs text-slate-200">
                          Great progress today! You reached 10,480 steps and burned 620 kcal. Keep hydration up and prioritize 30g protein for dinner.
                        </div>
                        <div className="rounded-xl bg-emerald-600/20 border border-emerald-500/30 p-2.5 text-xs text-emerald-300">
                          Tomorrow: Scheduled 20-min mobility &amp; core workout at 7:00 AM.
                        </div>
                      </div>
                    )}

                    {/* Tab 4: Diet & Nutrition */}
                    {activeTab === 'diet' && (
                      <div className="p-5 text-center animate-[fade-in_200ms_ease-out]">
                        <div className="text-xs text-slate-400 font-medium">Macronutrient Target</div>
                        <div className="my-3">
                          <span className="text-2xl font-extrabold text-white">1,850</span>
                          <span className="text-xs text-slate-400"> / 2,200 kcal</span>
                        </div>
                        <div className="space-y-2 text-left text-xs">
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-slate-300">Protein (128g / 140g)</span>
                              <span className="text-emerald-400 font-semibold">91%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full w-[91%]" />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-slate-300">Carbohydrates (190g / 220g)</span>
                              <span className="text-teal-400 font-semibold">86%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full bg-teal-400 rounded-full w-[86%]" />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-slate-300">Fats (48g / 60g)</span>
                              <span className="text-amber-400 font-semibold">80%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full w-[80%]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Trust Strip */}
      <section className="border-y border-slate-800/80 bg-slate-950/60 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white">50,000+</div>
              <div className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">Active Health Members</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">120M+</div>
              <div className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">Steps Accurately Logged</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-teal-300">99.8%</div>
              <div className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">Background Sync Reliability</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white">4.9 / 5</div>
              <div className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">Average User Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-28 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
              <Zap className="h-3.5 w-3.5" />
              <span>Full-Stack Wellness Telemetry</span>
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Engineered for Real Daily Health Progress
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Every feature is built natively into Android to ensure background sensor polling never sleeps, drains battery, or misses your milestones.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0C1220]/60 p-6 transition hover:border-emerald-500/40 hover:bg-[#0E1627]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-5">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Continuous Step Tracking</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Direct integration with Android Health Connect and hardware pedometers. Accurately logs steps even when the app is completely terminated.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0C1220]/60 p-6 transition hover:border-emerald-500/40 hover:bg-[#0E1627]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mb-5">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Cardiovascular Telemetry</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Continuous heart rate tracking, resting pulse trends, HRV metrics, and personalized cardiovascular intensity zone detection.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0C1220]/60 p-6 transition hover:border-emerald-500/40 hover:bg-[#0E1627]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 mb-5">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">24/7 AI Personal Coach</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Meet Jai and Jaya: your intelligent fitness and nutrition coaches providing dynamic advice, recovery alerts, and real-time encouragement.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0C1220]/60 p-6 transition hover:border-emerald-500/40 hover:bg-[#0E1627]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-5">
                <Utensils className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Diet &amp; Meal Macro Scanner</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Track calories, proteins, fats, carbs, and micronutrients effortlessly. Calibrated automatically to your individualized BMR and TDEE.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0C1220]/60 p-6 transition hover:border-emerald-500/40 hover:bg-[#0E1627]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-5">
                <Dumbbell className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Adaptive Workout Generator</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Customized strength, HIIT, mobility, and cardio training programs that automatically adjust weights, reps, and volume based on your recovery.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0C1220]/60 p-6 transition hover:border-emerald-500/40 hover:bg-[#0E1627]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-5">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Intelligent Reminders</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Smart push notifications categorized into distinct Android channels for hydration, routine nudges, meal logging, and streak protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-slate-950/60 border-y border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Get Started in 3 Simple Steps
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              No complicated onboarding. Experience true health autonomy within minutes.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-slate-800 bg-[#0C1220]/80 p-8">
              <div className="text-4xl font-extrabold text-emerald-500/30">01</div>
              <h3 className="mt-4 text-lg font-bold text-white">Download the APK</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Download the official, signed FitMe APK directly to your Android device from our secure distribution CDN.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-slate-800 bg-[#0C1220]/80 p-8">
              <div className="text-4xl font-extrabold text-teal-400/30">02</div>
              <h3 className="mt-4 text-lg font-bold text-white">Connect Health Data</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Grant read permissions to Health Connect or device motion sensors with one tap to sync background steps and heart rate.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-slate-800 bg-[#0C1220]/80 p-8">
              <div className="text-4xl font-extrabold text-emerald-400/30">03</div>
              <h3 className="mt-4 text-lg font-bold text-white">Start Your Plan</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Begin your 7-day all-feature free experience, receive tailored caloric targets, and let Jai &amp; Jaya coach your success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Carousel */}
      <section id="screenshots" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
              <Smartphone className="h-3.5 w-3.5" />
              <span>Real App Previews</span>
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Engineered with Precision &amp; Beauty
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-400">
              Captured directly from the active FitMe Android client.
            </p>
          </div>

          {/* Interactive Carousel */}
          <div className="relative max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={prevSlide}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                aria-label="Previous Screenshot"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <div className="w-full max-w-md mx-auto text-center">
                <div className="relative rounded-[36px] border-[5px] border-slate-700 bg-slate-950 p-2 shadow-2xl">
                  <img
                    src={SCREENSHOTS[currentSlide].src}
                    alt={SCREENSHOTS[currentSlide].title}
                    className="w-full rounded-[28px] object-cover max-h-[580px]"
                  />
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{SCREENSHOTS[currentSlide].title}</h3>
                <p className="mt-1 text-xs text-slate-400">{SCREENSHOTS[currentSlide].caption}</p>
              </div>

              <button
                type="button"
                onClick={nextSlide}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 text-slate-300 transition hover:bg-slate-800 hover:text-white"
                aria-label="Next Screenshot"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {/* Thumbnail Indicators */}
            <div className="mt-8 flex justify-center gap-2">
              {SCREENSHOTS.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all ${currentSlide === idx ? 'w-8 bg-emerald-400' : 'w-2 bg-slate-700 hover:bg-slate-600'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Access Section */}
      <section id="pricing" className="py-20 bg-slate-950/60 border-y border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Transparent Access</span>
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">
              Risk-Free Experience from Day One
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {pricingText.intro} · {pricingText.trial}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="rounded-2xl border border-slate-800 bg-[#0C1220]/60 p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Free Starter Access</h3>
                <p className="mt-1 text-xs text-slate-400">Essential health tracking for everyday consistency</p>
                <div className="mt-5 text-3xl font-extrabold text-white">₹0 <span className="text-xs font-normal text-slate-400">forever</span></div>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Real-time step tracking &amp; pedometer sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Calorie, water, and weight logs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Health Connect device synchronization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Core workout library and movement history</span>
                  </li>
                </ul>
              </div>
              <a
                href="#download"
                className="mt-8 flex h-11 w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-900 font-semibold text-sm text-white transition hover:bg-slate-800"
              >
                Start Free Starter
              </a>
            </div>

            {/* Pro / Subscription Tier */}
            <div className="relative rounded-2xl border-2 border-emerald-500/50 bg-[#0C1220] p-8 flex flex-col justify-between shadow-xl shadow-emerald-500/10">
              <div className="absolute -top-3 right-6 rounded-full bg-[#1FA45B] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Most Popular
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">FitMe Pro &amp; AI Coach</h3>
                <p className="mt-1 text-xs text-slate-400">Intelligent personal guidance &amp; micronutrient analysis</p>
                <div className="mt-5 text-3xl font-extrabold text-emerald-400">
                  {pricingText.premiumPrice}
                  <span className="text-xs font-normal text-slate-400"> after free trial</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Everything in Starter + 24/7 AI Coach Jai &amp; Jaya</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>AI Food Photo Macro &amp; Micronutrient Scanner</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Cardiovascular intensity zones &amp; recovery metrics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Adaptive workout plans with progressive overload</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>100% ad-free experience</span>
                  </li>
                </ul>
              </div>
              <a
                href="#download"
                className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-[#1FA45B] font-semibold text-sm text-white transition hover:bg-emerald-600 shadow-md"
              >
                Claim 7 Days Free + 30-Day Trial
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section (Part 2) */}
      <section id="download" className="py-20 md:py-28 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-[#0D1526] to-[#080D1A] p-8 sm:p-12 lg:p-16">
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
                  <Download className="h-3.5 w-3.5" />
                  <span>Direct Android APK Distribution</span>
                </div>
                <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Download FitMe for Android
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                  Get the official build directly from our servers. Faster updates, zero store telemetry, and maximum battery efficiency.
                </p>

                {/* Android Download CTA */}
                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <a
                    href="/download/android"
                    className="flex h-13 items-center justify-center gap-3 rounded-2xl bg-[#1FA45B] px-8 text-sm font-bold text-white shadow-xl shadow-emerald-500/25 transition hover:bg-emerald-600 active:scale-95"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download FitMe APK ({androidConfig.latestVersionName})</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setIosModalOpen(true)}
                    className="flex h-13 items-center justify-center gap-2.5 rounded-2xl border border-slate-700 bg-slate-900/60 px-6 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                  >
                    <Apple className="h-5 w-5" />
                    <span>iOS App Waitlist</span>
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span>Version: <strong className="text-white">{androidConfig.latestVersionName}</strong></span>
                  <span>•</span>
                  <span>Size: <strong className="text-white">{androidConfig.fileSizeMB} MB</strong></span>
                  <span>•</span>
                  <span>Released: <strong className="text-white">{androidConfig.releaseDate}</strong></span>
                </div>

                {/* 3-Step Sideload Installation Guide */}
                <div className="mt-10 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-6">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Info className="h-4 w-4 text-emerald-400" />
                    <span>3-Step Installation Guide for Android</span>
                  </h3>
                  <div className="mt-4 grid sm:grid-cols-3 gap-4 text-xs">
                    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3.5">
                      <div className="font-bold text-emerald-400">Step 1</div>
                      <p className="mt-1 text-slate-300 font-medium">Open Downloaded File</p>
                      <p className="mt-1 text-slate-400">Tap the APK notification or open it from your browser Downloads folder.</p>
                    </div>
                    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3.5">
                      <div className="font-bold text-emerald-400">Step 2</div>
                      <p className="mt-1 text-slate-300 font-medium">Allow Unknown Apps</p>
                      <p className="mt-1 text-slate-400">When prompted by Android, tap Settings and allow installation for your browser.</p>
                    </div>
                    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3.5">
                      <div className="font-bold text-emerald-400">Step 3</div>
                      <p className="mt-1 text-slate-300 font-medium">Tap Install</p>
                      <p className="mt-1 text-slate-400">Tap Install to finish. FitMe is ready and 100% verified safe.</p>
                    </div>
                  </div>

                  {/* Android Security Notice Box */}
                  <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-[11px] leading-relaxed text-emerald-300/90">
                    <strong>Why Android shows an &quot;Install unknown apps&quot; prompt:</strong> Android displays this protective warning whenever an app is installed directly from a browser rather than the Google Play Store. FitMe is cryptographically signed and free of malware.
                  </div>
                </div>
              </div>

              {/* QR Code Column for Desktop Visitors */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center text-center">
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
                  {/* Clean Crisp SVG QR Code */}
                  <div className="flex justify-center p-2 bg-white rounded-2xl">
                    <svg
                      viewBox="0 0 160 160"
                      className="h-44 w-44"
                      shapeRendering="crispEdges"
                    >
                      <rect width="160" height="160" fill="#ffffff" />
                      {/* Top Left Corner */}
                      <rect x="10" y="10" width="40" height="40" fill="#000000" />
                      <rect x="16" y="16" width="28" height="28" fill="#ffffff" />
                      <rect x="22" y="22" width="16" height="16" fill="#000000" />

                      {/* Top Right Corner */}
                      <rect x="110" y="10" width="40" height="40" fill="#000000" />
                      <rect x="116" y="16" width="28" height="28" fill="#ffffff" />
                      <rect x="122" y="22" width="16" height="16" fill="#000000" />

                      {/* Bottom Left Corner */}
                      <rect x="10" y="110" width="40" height="40" fill="#000000" />
                      <rect x="16" y="116" width="28" height="28" fill="#ffffff" />
                      <rect x="22" y="122" width="16" height="16" fill="#000000" />

                      {/* Data Pattern modules */}
                      <rect x="60" y="15" width="8" height="8" fill="#000000" />
                      <rect x="75" y="15" width="8" height="8" fill="#000000" />
                      <rect x="90" y="25" width="8" height="8" fill="#000000" />
                      <rect x="60" y="35" width="8" height="8" fill="#000000" />
                      <rect x="80" y="45" width="8" height="8" fill="#000000" />
                      <rect x="15" y="60" width="8" height="8" fill="#000000" />
                      <rect x="30" y="70" width="8" height="8" fill="#000000" />
                      <rect x="45" y="60" width="8" height="8" fill="#000000" />
                      <rect x="60" y="65" width="8" height="8" fill="#000000" />
                      <rect x="75" y="75" width="14" height="14" fill="#1FA45B" rx="3" />
                      <rect x="95" y="60" width="8" height="8" fill="#000000" />
                      <rect x="110" y="70" width="8" height="8" fill="#000000" />
                      <rect x="135" y="60" width="8" height="8" fill="#000000" />
                      <rect x="60" y="90" width="8" height="8" fill="#000000" />
                      <rect x="80" y="100" width="8" height="8" fill="#000000" />
                      <rect x="95" y="90" width="8" height="8" fill="#000000" />
                      <rect x="15" y="95" width="8" height="8" fill="#000000" />
                      <rect x="35" y="95" width="8" height="8" fill="#000000" />
                      <rect x="60" y="115" width="8" height="8" fill="#000000" />
                      <rect x="75" y="125" width="8" height="8" fill="#000000" />
                      <rect x="90" y="115" width="8" height="8" fill="#000000" />
                      <rect x="110" y="120" width="8" height="8" fill="#000000" />
                      <rect x="130" y="130" width="8" height="8" fill="#000000" />
                      <rect x="140" y="115" width="8" height="8" fill="#000000" />
                    </svg>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-200">
                    <QrCode className="h-4 w-4 text-emerald-400" />
                    <span>Scan with Your Phone Camera</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Instantly opens the APK download on your mobile device
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 md:py-28 bg-slate-950/60 border-t border-slate-800/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Clear answers regarding installation, health privacy, and distribution.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Why does Android warn me when installing the APK?',
                a: 'Android displays an "Install unknown apps" prompt for any app downloaded outside the Google Play Store as a default security safeguard. FitMe is directly distributed by Sindulis Innovative Solutions to provide instant updates without 14-day Play Store review delays. The package is cryptographically signed with our private release key and is 100% verified safe.',
              },
              {
                q: 'When is the iPhone (iOS) app coming?',
                a: 'The native iOS version is currently in active development to integrate natively with Apple HealthKit. We do NOT provide a PWA web install for iOS because browsers cannot access Apple Watch or HealthKit sensors. Join our iOS waitlist above to be notified the moment our TestFlight beta opens.',
              },
              {
                q: 'Does step counting work when the app is completely closed?',
                a: 'Yes! FitMe utilizes Android Health Connect alongside an integrated hardware pedometer service managed by Android WorkManager. Your daily steps and active calorie burn sync automatically in the background even after restarts.',
              },
              {
                q: 'Can I cancel my subscription at any time?',
                a: 'Yes, absolutely. You can cancel your subscription inside the app under Settings → Subscriptions with zero penalties, or by emailing support@fitme.ai. You will retain full access until the end of your billing period.',
              },
              {
                q: 'How is my personal health and biometric data kept secure?',
                a: 'Your biometric records, step telemetry, and nutrition logs are stored in Google Cloud Firestore with AES-256 encryption at rest and TLS 1.3 in transit. We never sell or share your health telemetry with advertisers or third parties.',
              },
              {
                q: 'How can I request permanent deletion of my account and data?',
                a: 'You can delete your account instantly inside the FitMe app (Settings → Account → Delete Account) or submit an email removal request via our public portal at /delete-account. All data is irreversibly purged within 48 hours.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-[#0C1220]/60 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-white hover:text-emerald-400"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180 text-emerald-400' : 'text-slate-400'}`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/40">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#060A13] py-12 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="FitMe" width={30} height={30} className="h-7 w-7 rounded-lg" />
              <div>
                <span className="font-bold text-white text-sm">FitMe</span>
                <span className="block text-[11px] text-slate-500">For a Healthier Life</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-slate-300 font-medium">
              <Link to="/privacy" className="hover:text-emerald-400 transition">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-emerald-400 transition">Terms of Service</Link>
              <Link to="/refund" className="hover:text-emerald-400 transition">Refund Policy</Link>
              <Link to="/delete-account" className="hover:text-rose-400 transition">Delete Account</Link>
              <a href="mailto:sinfoxmedia@gmail.com" className="hover:text-emerald-400 transition">Contact</a>
            </div>

            <div className="text-slate-500 text-[11px]">
              &copy; {new Date().getFullYear()} Sindulis Innovative Solutions. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* iOS Waitlist Modal */}
      {iosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-[fade-in_150ms_ease-out]">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-[#0D1526] p-6 sm:p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setIosModalOpen(false);
                setIosSubmitted(false);
                setIosError(null);
              }}
              className="absolute right-5 top-5 rounded-xl p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-white mb-4">
              <Apple className="h-6 w-6" />
            </div>

            <h3 className="text-xl font-bold text-white">FitMe for iPhone (iOS)</h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              We are finalizing native Apple HealthKit integration for iOS and watchOS. Leave your email to receive an instant invitation when our TestFlight beta opens.
            </p>

            {iosSubmitted ? (
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
                <h4 className="mt-2 text-sm font-semibold text-white">You&apos;re on the VIP waitlist!</h4>
                <p className="mt-1 text-xs text-slate-400">
                  We will notify you at <strong>{iosEmail}</strong> the moment the iOS version is released.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIosModalOpen(false);
                    setIosSubmitted(false);
                  }}
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-xl bg-slate-800 px-4 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleIosWaitlist} className="mt-6 space-y-4">
                {iosError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-2.5 text-xs text-rose-300">
                    {iosError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={iosEmail}
                    onChange={(e) => setIosEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={iosSubmitting}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1FA45B] text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                >
                  {iosSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Notify Me at Launch</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
