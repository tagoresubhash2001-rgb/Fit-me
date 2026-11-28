import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  hasDropdown?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'Features', path: '/features', hasDropdown: true },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Download', path: '/download' },
  { label: 'About', path: '/about' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Contact', path: '/contact' },
];

const FEATURE_DROPDOWN_ITEMS = [
  { label: 'Activity & Steps', desc: 'Hardware & Health Connect sync', hash: 'activity' },
  { label: 'Heart Rate & Vitals', desc: 'Cardio zones & resting telemetry', hash: 'heart-rate' },
  { label: 'Food & Macros', desc: 'Calorie budget & nutrient balance', hash: 'food-macros' },
  { label: 'Water & Hydration', desc: 'Daily goals & smart logs', hash: 'water' },
  { label: 'Sleep & Recovery', desc: 'Sleep stages & quality index', hash: 'sleep' },
  { label: 'Weight & Body', desc: 'BMI trends & milestone tracker', hash: 'weight' },
  { label: 'Workouts & GPS', desc: 'Pace, elevation & route maps', hash: 'workouts' },
  { label: 'AI Health Coach', desc: 'Personalized guidance & advice', hash: 'ai-coach' },
  { label: 'Progress Insights', desc: 'Interactive charts & milestones', hash: 'insights' },
  { label: 'Reminders & Habits', desc: 'Actionable smart notifications', hash: 'reminders' },
];

export function DynamicIslandNavbar() {
  const location = useLocation();
  const currentPath = location.pathname;

  // Animation states
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompactOnScroll, setIsCompactOnScroll] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const lastScrollY = useRef(0);
  const featuresDropdownRef = useRef<HTMLDivElement>(null);
  const islandRef = useRef<HTMLDivElement>(null);

  // Initial load spring-like expansion
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExpanded(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Scroll direction detection for dynamic island collapse / expand
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollY.current;

          if (currentScrollY > 100 && delta > 8 && !mobileMenuOpen) {
            // Scrolling down past threshold -> shrink to compact island
            setIsCompactOnScroll(true);
            setFeaturesOpen(false);
          } else if (delta < -12 || currentScrollY <= 80) {
            // Scrolling up or near top -> expand
            setIsCompactOnScroll(false);
          }

          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  // Lock body scroll on mobile menu open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setFeaturesOpen(false);
  }, [currentPath]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (islandRef.current && !islandRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false);
        setMobileMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFeaturesOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Is the island showing compact mode?
  const showCompact = (!isExpanded || isCompactOnScroll) && !isHovered && !mobileMenuOpen;

  // Active item title for compact view
  const activeNavItem = NAV_ITEMS.find((item) =>
    item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path)
  ) || NAV_ITEMS[0];

  return (
    <>
      {/* Dynamic Island Floating Header */}
      <header
        className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
        role="banner"
      >
        <div
          ref={islandRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setFeaturesOpen(false);
          }}
          className={`pointer-events-auto relative transition-all duration-300 ease-out ${
            showCompact
              ? 'h-12 w-[340px] sm:w-[380px] rounded-full shadow-md bg-white/95 dark:bg-[#121714]/95 border border-[#1FA45B]/25'
              : mobileMenuOpen
              ? 'w-full max-w-[420px] rounded-[28px] shadow-2xl bg-white dark:bg-[#121714] border border-[#1FA45B]/30'
              : 'h-14 max-w-[940px] w-full rounded-full shadow-lg shadow-black/5 bg-white/90 dark:bg-[#121714]/90 border border-slate-200/80 dark:border-white/10'
          } backdrop-blur-xl`}
        >
          {/* COMPACT ISLAND VIEW (Shown on scroll down or initial compact state) */}
          {showCompact ? (
            <div className="flex h-full w-full items-center justify-between px-3">
              {/* Logo & Status */}
              <Link
                to="/"
                className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA45B] rounded-full p-1"
                aria-label="FitMe Home"
              >
                <img src="/favicon.svg" alt="FitMe" width={28} height={28} className="h-7 w-7 rounded-lg" />
                <span className="font-semibold text-sm tracking-tight text-[#11181C] dark:text-white">FitMe</span>
              </Link>

              {/* Active Route Pill Indicator */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0FDF4] dark:bg-[#1FA45B]/15 text-[#1FA45B] text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1FA45B] animate-pulse" />
                <span>{activeNavItem.label}</span>
              </div>

              {/* Quick Action Button */}
              <Link
                to="/download"
                className="inline-flex items-center justify-center gap-1.5 h-8 px-3.5 rounded-full bg-[#1FA45B] hover:bg-[#178A4C] text-white text-xs font-medium transition-all shadow-sm active:scale-95"
              >
                <span>Get App</span>
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V4a1 1 0 011-1z" clipRule="evenodd" />
                  <path d="M4 14a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" />
                </svg>
              </Link>
            </div>
          ) : (
            /* EXPANDED DESKTOP / TABLET ISLAND VIEW */
            <div className="flex h-14 w-full items-center justify-between px-3 md:px-5">
              {/* Logo */}
              <Link
                to="/"
                className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA45B] rounded-full p-1 group"
                aria-label="FitMe Home"
              >
                <img
                  src="/favicon.svg"
                  alt="FitMe logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg shadow-sm transition-transform group-hover:scale-105"
                />
                <div className="flex flex-col text-left">
                  <span className="font-bold text-base tracking-tight leading-none text-[#11181C] dark:text-white">
                    FitMe
                  </span>
                  <span className="text-[10px] text-[#5B6471] dark:text-[#9AA89E] font-medium leading-tight">
                    For a Healthier Life
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center gap-1 relative" aria-label="Main Navigation">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    item.path === '/'
                      ? currentPath === '/'
                      : currentPath.startsWith(item.path);

                  if (item.hasDropdown) {
                    return (
                      <div
                        key={item.path}
                        className="relative"
                        onMouseEnter={() => setFeaturesOpen(true)}
                      >
                        <button
                          type="button"
                          onClick={() => setFeaturesOpen((prev) => !prev)}
                          aria-expanded={featuresOpen}
                          className={`flex items-center gap-1 h-9 px-3.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                            isActive || featuresOpen
                              ? 'bg-[#F0FDF4] dark:bg-[#1FA45B]/15 text-[#1FA45B] shadow-xs'
                              : 'text-[#5B6471] dark:text-[#CBD5E1] hover:text-[#11181C] dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5'
                          }`}
                        >
                          <span>{item.label}</span>
                          <svg
                            className={`h-3.5 w-3.5 transition-transform duration-200 ${
                              featuresOpen ? 'rotate-180 text-[#1FA45B]' : 'text-slate-400'
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                          </svg>
                        </button>

                        {/* Morphing Features Dropdown Sub-Island */}
                        {featuresOpen && (
                          <div
                            ref={featuresDropdownRef}
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[460px] p-3 rounded-2xl bg-white/95 dark:bg-[#121714]/95 shadow-xl shadow-black/10 border border-slate-200/90 dark:border-white/10 backdrop-blur-2xl grid grid-cols-2 gap-1.5 transition-all animate-in fade-in zoom-in-95 duration-150 z-50"
                          >
                            <div className="col-span-2 px-2 py-1 text-[11px] font-semibold text-[#1FA45B] uppercase tracking-wider border-b border-slate-100 dark:border-white/5 mb-1 flex items-center justify-between">
                              <span>FitMe Health Capabilities</span>
                              <Link
                                to="/features"
                                onClick={() => setFeaturesOpen(false)}
                                className="text-[11px] font-medium text-[#5B6471] dark:text-slate-400 hover:text-[#1FA45B] underline"
                              >
                                View all features →
                              </Link>
                            </div>
                            {FEATURE_DROPDOWN_ITEMS.map((feat) => (
                              <Link
                                key={feat.hash}
                                to={`/features#${feat.hash}`}
                                onClick={() => setFeaturesOpen(false)}
                                className="flex flex-col p-2 rounded-xl text-left hover:bg-[#F0FDF4] dark:hover:bg-[#1FA45B]/10 transition-colors group"
                              >
                                <span className="text-xs font-semibold text-[#11181C] dark:text-white group-hover:text-[#1FA45B] transition-colors">
                                  {feat.label}
                                </span>
                                <span className="text-[11px] text-[#5B6471] dark:text-[#9AA89E] leading-tight">
                                  {feat.desc}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative h-9 px-3.5 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center ${
                        isActive
                          ? 'bg-[#F0FDF4] dark:bg-[#1FA45B]/15 text-[#1FA45B] shadow-xs'
                          : 'text-[#5B6471] dark:text-[#CBD5E1] hover:text-[#11181C] dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#1FA45B]" />
                      )}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Tablet Middle Quick Links */}
              <nav className="hidden sm:flex lg:hidden items-center gap-1" aria-label="Tablet Navigation">
                <Link
                  to="/features"
                  className={`h-8 px-3 rounded-full text-xs font-semibold ${
                    currentPath.startsWith('/features')
                      ? 'bg-[#F0FDF4] dark:bg-[#1FA45B]/15 text-[#1FA45B]'
                      : 'text-[#5B6471] dark:text-slate-300'
                  }`}
                >
                  Features
                </Link>
                <Link
                  to="/how-it-works"
                  className={`h-8 px-3 rounded-full text-xs font-semibold ${
                    currentPath.startsWith('/how-it-works')
                      ? 'bg-[#F0FDF4] dark:bg-[#1FA45B]/15 text-[#1FA45B]'
                      : 'text-[#5B6471] dark:text-slate-300'
                  }`}
                >
                  How It Works
                </Link>
              </nav>

              {/* Right Side Action & Hamburger */}
              <div className="flex items-center gap-2">
                <Link
                  to="/download"
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-full bg-[#1FA45B] hover:bg-[#178A4C] text-white text-xs font-semibold transition-all shadow-sm hover:shadow-md hover:shadow-[#1FA45B]/20 active:scale-95"
                >
                  <span>Download App</span>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V4a1 1 0 011-1z" clipRule="evenodd" />
                    <path d="M4 14a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" />
                  </svg>
                </Link>

                {/* Mobile Hamburger Trigger */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  aria-expanded={mobileMenuOpen}
                  aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
                  className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-[#11181C] dark:text-white hover:bg-slate-200 transition-colors"
                >
                  {mobileMenuOpen ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <line x1="4" y1="7" x2="20" y2="7" />
                      <line x1="4" y1="12" x2="20" y2="12" />
                      <line x1="4" y1="17" x2="20" y2="17" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* MOBILE MORPHED MENU EXPANDED PANEL */}
          {mobileMenuOpen && (
            <div className="lg:hidden px-4 pt-2 pb-6 border-t border-slate-100 dark:border-white/10 flex flex-col gap-1 max-h-[80vh] overflow-y-auto">
              <div className="py-2 px-1 text-[11px] font-semibold text-[#1FA45B] uppercase tracking-wider">
                Menu Navigation
              </div>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.path === '/'
                    ? currentPath === '/'
                    : currentPath.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#F0FDF4] dark:bg-[#1FA45B]/15 text-[#1FA45B]'
                        : 'text-[#11181C] dark:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="h-2 w-2 rounded-full bg-[#1FA45B]" />
                    )}
                  </Link>
                );
              })}

              {/* Mobile Quick Features Section */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10">
                <div className="flex items-center justify-between px-1 mb-2">
                  <span className="text-[11px] font-semibold text-[#1FA45B] uppercase tracking-wider">
                    Core App Features
                  </span>
                  <Link
                    to="/features"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-medium text-[#5B6471] hover:text-[#1FA45B] underline"
                  >
                    All Features
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {FEATURE_DROPDOWN_ITEMS.slice(0, 6).map((feat) => (
                    <Link
                      key={feat.hash}
                      to={`/features#${feat.hash}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-[#F0FDF4] text-xs font-medium text-[#11181C] dark:text-slate-200"
                    >
                      {feat.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Download CTA */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10">
                <Link
                  to="/download"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 h-11 w-full rounded-xl bg-[#1FA45B] hover:bg-[#178A4C] text-white font-semibold text-sm shadow-md"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V4a1 1 0 011-1z" clipRule="evenodd" />
                    <path d="M4 14a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" />
                  </svg>
                  <span>Download FitMe for Android</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Dim backdrop when mobile menu is open */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}
    </>
  );
}
