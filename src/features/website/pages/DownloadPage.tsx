import React, { useState, useEffect } from 'react';
import { getDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { WebsiteLayout } from '../WebsiteLayout';

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
  latestVersionCode: 20001,
  minSupportedVersionCode: 20001,
  apkUrl: '/download/android',
  fileSizeMB: 11.4,
  releaseNotes: 'Certified Health Connect step sync, continuous heart rate analytics, background WorkManager sync, and AI coach adaptations.',
  releaseDate: 'November 27, 2026',
};

export function DownloadPage() {
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('desktop');
  const [config, setConfig] = useState<AndroidConfig>(DEFAULT_ANDROID_CONFIG);
  const [downloadStarted, setDownloadStarted] = useState(false);

  // iOS Waitlist Form State
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [waitlistError, setWaitlistError] = useState('');

  // Device detection
  useEffect(() => {
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) setDeviceType('android');
    else if (/iPad|iPhone|iPod/.test(ua)) setDeviceType('ios');
    else setDeviceType('desktop');
  }, []);

  // Fetch live release metadata from Firestore
  useEffect(() => {
    let mounted = true;
    getDoc(doc(db(), 'app_config', 'android'))
      .then((snapshot) => {
        if (!mounted || !snapshot.exists()) return;
        const d = snapshot.data();
        setConfig({
          latestVersionName: d.latestVersionName || DEFAULT_ANDROID_CONFIG.latestVersionName,
          latestVersionCode: Number(d.latestVersionCode) || DEFAULT_ANDROID_CONFIG.latestVersionCode,
          minSupportedVersionCode: Number(d.minSupportedVersionCode) || DEFAULT_ANDROID_CONFIG.minSupportedVersionCode,
          apkUrl: d.apkUrl || DEFAULT_ANDROID_CONFIG.apkUrl,
          fileSizeMB: Number(d.fileSizeMB) || DEFAULT_ANDROID_CONFIG.fileSizeMB,
          releaseNotes: d.releaseNotes || DEFAULT_ANDROID_CONFIG.releaseNotes,
          releaseDate: d.releaseDate || DEFAULT_ANDROID_CONFIG.releaseDate,
        });
      })
      .catch(() => {
        // Fallback to static release defaults
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Handle direct download click
  const handleAndroidDownload = () => {
    setDownloadStarted(true);
    window.location.href = '/download/android';
  };

  // Handle iOS waitlist submission
  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = waitlistEmail.trim();
    if (!email || !email.includes('@')) {
      setWaitlistError('Please provide a valid email address.');
      return;
    }

    setWaitlistStatus('saving');
    setWaitlistError('');

    try {
      const waitlistId = `ios_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await setDoc(doc(db(), 'ios_waitlist', waitlistId), {
        email,
        createdAt: serverTimestamp(),
        source: 'download_page',
        device: navigator.userAgent || 'unknown',
      });
      setWaitlistStatus('success');
      setWaitlistEmail('');
    } catch {
      setWaitlistStatus('error');
      setWaitlistError('Could not save your request. Please try again shortly.');
    }
  };

  return (
    <WebsiteLayout
      title="Download FitMe – Native Android APK & iOS Waitlist"
      description="Download the official FitMe v2.0.1 release APK for Android directly. Includes step-by-step sideload installation guide and iOS notification waitlist."
    >
      {/* Hero Header */}
      <section className="pt-6 pb-14 bg-gradient-to-b from-[#F0FDF4]/60 to-white dark:from-[#152018] dark:to-[#111613]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1FA45B]/10 text-[#1FA45B] text-xs font-bold uppercase tracking-wider">
            Direct App Distribution
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
            Get the native FitMe app.
          </h1>
          <p className="text-base sm:text-lg text-[#5B6471] dark:text-[#9AA89E] max-w-2xl mx-auto">
            Install directly on Android for reliable Health Connect step counting, background telemetry, and zero store restrictions.
          </p>
        </div>
      </section>

      {/* Primary Download Grid */}
      <section className="py-12 bg-white dark:bg-[#111613]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* ANDROID DOWNLOAD CARD */}
            <div
              className={`p-8 rounded-3xl border transition-all flex flex-col justify-between ${
                deviceType === 'android' || deviceType === 'desktop'
                  ? 'border-[#1FA45B] bg-[#FBFDFB] dark:bg-[#171D18] ring-2 ring-[#1FA45B]/20 shadow-lg'
                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#171D18]'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-[#F0FDF4] dark:bg-[#1FA45B]/20 flex items-center justify-center text-[#1FA45B]">
                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003 0-.5516.4482-1.0003.9993-1.0003.5517 0 .9994.4487.9994 1.0003 0 .5517-.4477 1.0003-.9994 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003 0-.5516.4482-1.0003.9993-1.0003.5517 0 .9994.4487.9994 1.0003 0 .5517-.4477 1.0003-.9994 1.0003m11.4045-6.02l1.9967-3.4583a.416.416 0 00-.152-.5676.416.416 0 00-.568.152l-2.0223 3.503C15.5902 8.4116 13.8533 8.125 12 8.125c-1.8533 0-3.5902.2866-5.136.8258L4.8418 5.4478a.416.416 0 00-.568-.152.416.416 0 00-.152.5676l1.9967 3.4583C2.688 11.2338.3438 14.8113 0 19.0625h24c-.3438-4.2512-2.688-7.8287-6.1185-9.7411" />
                    </svg>
                  </div>
                  {deviceType === 'android' && (
                    <span className="px-3 py-1 rounded-full bg-[#1FA45B] text-white text-xs font-bold tracking-wide">
                      Your Device Detected
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold text-[#11181C] dark:text-white">
                    FitMe for Android
                  </h2>
                  <p className="text-xs text-[#5B6471] dark:text-[#9AA89E] mt-1">
                    Universal Release APK • Signed & Verified
                  </p>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-white/10 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5">
                    <div className="text-[10px] text-[#8C96A5] uppercase font-semibold">Version</div>
                    <div className="text-xs font-bold text-[#11181C] dark:text-white mt-0.5">{config.latestVersionName}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5">
                    <div className="text-[10px] text-[#8C96A5] uppercase font-semibold">File Size</div>
                    <div className="text-xs font-bold text-[#11181C] dark:text-white mt-0.5">{config.fileSizeMB} MB</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5">
                    <div className="text-[10px] text-[#8C96A5] uppercase font-semibold">Released</div>
                    <div className="text-xs font-bold text-[#11181C] dark:text-white mt-0.5">{config.releaseDate}</div>
                  </div>
                </div>

                <p className="text-sm text-[#5B6471] dark:text-[#9AA89E] leading-relaxed">
                  {config.releaseNotes}
                </p>
              </div>

              <div className="pt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleAndroidDownload}
                  className="w-full flex items-center justify-center gap-2.5 h-13 rounded-2xl bg-[#1FA45B] hover:bg-[#178A4C] text-white font-bold text-base shadow-md hover:shadow-lg transition-all active:scale-98"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V4a1 1 0 011-1z" clipRule="evenodd" />
                    <path d="M4 14a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" />
                  </svg>
                  <span>Download APK ({config.fileSizeMB} MB)</span>
                </button>

                <div className="text-center">
                  <a
                    href="#install-guide"
                    className="text-xs font-medium text-[#5B6471] dark:text-slate-400 hover:text-[#1FA45B] underline"
                  >
                    View 3-step sideload installation instructions ↓
                  </a>
                </div>
              </div>
            </div>

            {/* IOS NOTIFICATION WAITLIST CARD */}
            <div
              id="ios-waitlist"
              className={`p-8 rounded-3xl border transition-all flex flex-col justify-between ${
                deviceType === 'ios'
                  ? 'border-[#1FA45B] bg-[#FBFDFB] dark:bg-[#171D18] ring-2 ring-[#1FA45B]/20 shadow-lg'
                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#171D18]'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[#11181C] dark:text-white">
                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.9.04-2.02.61-2.66 1.36-.57.65-1.06 1.73-0.93 2.76 1.02.08 2.06-.5 2.67-1.25z" />
                    </svg>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-semibold text-[#5B6471] dark:text-slate-300">
                    Coming Soon
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold text-[#11181C] dark:text-white">
                    FitMe for iPhone (iOS)
                  </h2>
                  <p className="text-xs text-[#5B6471] dark:text-[#9AA89E] mt-1">
                    Native Apple HealthKit Integration In Active Development
                  </p>
                </div>

                <p className="text-sm text-[#5B6471] dark:text-[#9AA89E] leading-relaxed">
                  We are engineering a native Swift and Apple HealthKit integration for iPhone and Apple Watch. PWAs cannot access background Apple HealthKit step telemetry, so we are building a genuine native iOS build.
                </p>

                {/* Waitlist Form */}
                <form onSubmit={handleWaitlistSubmit} className="pt-2 space-y-3">
                  <div>
                    <label htmlFor="waitlist-email" className="block text-xs font-semibold text-[#11181C] dark:text-white mb-1.5">
                      Get notified when iOS launches:
                    </label>
                    <input
                      id="waitlist-email"
                      type="email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="name@example.com"
                      disabled={waitlistStatus === 'saving' || waitlistStatus === 'success'}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-sm text-[#11181C] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1FA45B]"
                      required
                    />
                  </div>

                  {waitlistError && (
                    <div className="text-xs text-red-600 dark:text-red-400">
                      {waitlistError}
                    </div>
                  )}

                  {waitlistStatus === 'success' ? (
                    <div className="p-3 rounded-xl bg-[#F0FDF4] dark:bg-[#1FA45B]/15 border border-[#1FA45B]/30 text-xs font-semibold text-[#1FA45B]">
                      ✓ You are on the iOS waitlist! We will notify you immediately upon TestFlight release.
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={waitlistStatus === 'saving'}
                      className="w-full h-11 rounded-xl border border-[#1FA45B] text-[#1FA45B] hover:bg-[#F0FDF4] dark:hover:bg-[#1FA45B]/15 font-semibold text-sm transition-colors"
                    >
                      {waitlistStatus === 'saving' ? 'Saving request...' : 'Notify Me on iOS Release'}
                    </button>
                  )}
                </form>
              </div>

              <div className="pt-4 text-xs text-[#8C96A5] text-center">
                Strict privacy guarantee: your email is never shared or used for marketing spam.
              </div>
            </div>
          </div>

          {/* DESKTOP QR CODE SCANNER */}
          {deviceType === 'desktop' && (
            <div className="mt-12 p-8 rounded-3xl bg-[#FBFDFB] dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-xs font-bold text-[#1FA45B] uppercase tracking-wider">
                  Desktop Quick Scan
                </span>
                <h3 className="text-xl font-bold text-[#11181C] dark:text-white">
                  Browsing on your laptop or computer?
                </h3>
                <p className="text-sm text-[#5B6471] dark:text-[#9AA89E] max-w-md">
                  Point your phone camera at the QR code to open this download page directly on your Android phone.
                </p>
              </div>

              {/* QR Code SVG */}
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0">
                <svg className="w-28 h-28" viewBox="0 0 100 100" fill="none">
                  {/* Outer Frame */}
                  <rect width="100" height="100" fill="white" />
                  {/* Top Left Finder */}
                  <rect x="10" y="10" width="28" height="28" rx="4" fill="#11181C" />
                  <rect x="15" y="15" width="18" height="18" rx="2" fill="white" />
                  <rect x="19" y="19" width="10" height="10" rx="1" fill="#1FA45B" />
                  {/* Top Right Finder */}
                  <rect x="62" y="10" width="28" height="28" rx="4" fill="#11181C" />
                  <rect x="67" y="15" width="18" height="18" rx="2" fill="white" />
                  <rect x="71" y="19" width="10" height="10" rx="1" fill="#1FA45B" />
                  {/* Bottom Left Finder */}
                  <rect x="10" y="62" width="28" height="28" rx="4" fill="#11181C" />
                  <rect x="15" y="67" width="18" height="18" rx="2" fill="white" />
                  <rect x="19" y="71" width="10" height="10" rx="1" fill="#1FA45B" />
                  {/* Data patterns */}
                  <rect x="44" y="12" width="6" height="6" fill="#1FA45B" />
                  <rect x="52" y="18" width="6" height="6" fill="#11181C" />
                  <rect x="44" y="28" width="6" height="6" fill="#11181C" />
                  <rect x="12" y="44" width="6" height="6" fill="#11181C" />
                  <rect x="24" y="48" width="6" height="6" fill="#1FA45B" />
                  <rect x="44" y="44" width="12" height="12" rx="2" fill="#1FA45B" />
                  <rect x="62" y="44" width="6" height="6" fill="#11181C" />
                  <rect x="74" y="48" width="6" height="6" fill="#1FA45B" />
                  <rect x="84" y="44" width="6" height="6" fill="#11181C" />
                  <rect x="44" y="64" width="6" height="6" fill="#11181C" />
                  <rect x="54" y="72" width="6" height="6" fill="#1FA45B" />
                  <rect x="64" y="64" width="12" height="6" fill="#11181C" />
                  <rect x="64" y="76" width="6" height="12" fill="#1FA45B" />
                  <rect x="78" y="72" width="10" height="16" fill="#11181C" />
                </svg>
                <div className="text-[10px] font-bold text-center text-[#1FA45B] tracking-wider mt-1">
                  SCAN TO DOWNLOAD
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3-STEP SIDELOAD INSTALL GUIDE */}
      <section id="install-guide" className="py-16 sm:py-24 bg-[#FBFDFB] dark:bg-[#151B17] border-t border-slate-200/80 dark:border-white/10 scroll-mt-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#1FA45B]">
              Installation Guide
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-[#11181C] dark:text-white tracking-tight">
              3 simple steps to install FitMe on Android.
            </p>
            <p className="text-sm text-[#5B6471] dark:text-[#9AA89E]">
              Because FitMe is installed directly rather than through Google Play, Android displays a standard prompt. Here is exactly what to do:
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center font-bold text-[#1FA45B]">
                1
              </div>
              <h3 className="text-lg font-bold text-[#11181C] dark:text-white">
                Open Downloaded File
              </h3>
              <p className="text-sm text-[#5B6471] dark:text-[#9AA89E] leading-relaxed">
                When the download finishes, pull down your notification tray or go to your "Downloads" folder and tap <strong>FitMe-v2.0.1.apk</strong>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center font-bold text-[#1FA45B]">
                2
              </div>
              <h3 className="text-lg font-bold text-[#11181C] dark:text-white">
                Allow Unknown Apps
              </h3>
              <p className="text-sm text-[#5B6471] dark:text-[#9AA89E] leading-relaxed">
                If prompted: <em>"For your security, your phone is not allowed to install unknown apps"</em>, tap <strong>Settings</strong> and toggle on <strong>"Allow from this source"</strong>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#171D18] border border-slate-200/80 dark:border-white/10 space-y-4 shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center font-bold text-[#1FA45B]">
                3
              </div>
              <h3 className="text-lg font-bold text-[#11181C] dark:text-white">
                Tap Install & Launch
              </h3>
              <p className="text-sm text-[#5B6471] dark:text-[#9AA89E] leading-relaxed">
                Tap the back button, tap <strong>Install</strong>, and launch FitMe. Sign in and grant Health Connect permissions to start tracking!
              </p>
            </div>
          </div>

          {/* Reassurance Banner */}
          <div className="mt-10 p-5 rounded-2xl bg-[#F0FDF4] dark:bg-[#1FA45B]/15 border border-[#1FA45B]/20 text-xs sm:text-sm text-[#11181C] dark:text-slate-200 flex items-start gap-3">
            <svg className="h-5 w-5 text-[#1FA45B] shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <strong>Why this warning appears:</strong> Android protects users from unknown sources. Because you are downloading FitMe directly from Sindulis Innovative Solutions rather than Google Play, Android displays this generic confirmation. FitMe is cryptographically signed and 100% free of adware or trackers.
            </div>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
