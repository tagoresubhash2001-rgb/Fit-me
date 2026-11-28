import React from 'react';
import { Link } from 'react-router-dom';

export function WebsiteFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-white/10 bg-[#FBFDFB] dark:bg-[#111613] text-[#11181C] dark:text-[#E2E8F0] pt-16 pb-12 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200/80 dark:border-white/10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img
                src="/favicon.svg"
                alt="FitMe"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl shadow-xs transition-transform group-hover:scale-105"
              />
              <span className="text-xl font-bold tracking-tight text-[#11181C] dark:text-white">
                FitMe
              </span>
            </Link>
            <p className="text-sm text-[#5B6471] dark:text-[#9AA89E] max-w-sm leading-relaxed">
              FitMe – For a Healthier Life. Privacy-first, native health tracking with Health Connect step telemetry, heart rate analytics, food macros, and intelligent AI wellness guidance.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <Link
                to="/download"
                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-[#1FA45B] hover:bg-[#178A4C] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003 0-.5516.4482-1.0003.9993-1.0003.5517 0 .9994.4487.9994 1.0003 0 .5517-.4477 1.0003-.9994 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003 0-.5516.4482-1.0003.9993-1.0003.5517 0 .9994.4487.9994 1.0003 0 .5517-.4477 1.0003-.9994 1.0003m11.4045-6.02l1.9967-3.4583a.416.416 0 00-.152-.5676.416.416 0 00-.568.152l-2.0223 3.503C15.5902 8.4116 13.8533 8.125 12 8.125c-1.8533 0-3.5902.2866-5.136.8258L4.8418 5.4478a.416.416 0 00-.568-.152.416.416 0 00-.152.5676l1.9967 3.4583C2.688 11.2338.3438 14.8113 0 19.0625h24c-.3438-4.2512-2.688-7.8287-6.1185-9.7411" />
                </svg>
                <span>Download Android APK</span>
              </Link>
              <Link
                to="/download"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-semibold text-[#11181C] dark:text-white transition-colors"
              >
                <span>iOS Waitlist</span>
              </Link>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1FA45B]">
              Product
            </h3>
            <ul className="space-y-2.5 text-sm text-[#5B6471] dark:text-[#CBD5E1]">
              <li>
                <Link to="/features" className="hover:text-[#1FA45B] transition-colors">
                  All Features
                </Link>
              </li>
              <li>
                <Link to="/features#activity" className="hover:text-[#1FA45B] transition-colors">
                  Step & Activity Tracking
                </Link>
              </li>
              <li>
                <Link to="/features#heart-rate" className="hover:text-[#1FA45B] transition-colors">
                  Heart Rate & Vitals
                </Link>
              </li>
              <li>
                <Link to="/features#food-macros" className="hover:text-[#1FA45B] transition-colors">
                  Food & Macro Calculator
                </Link>
              </li>
              <li>
                <Link to="/features#ai-coach" className="hover:text-[#1FA45B] transition-colors">
                  AI Wellness Coach
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-[#1FA45B] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/download" className="hover:text-[#1FA45B] transition-colors">
                  Download Mobile App
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1FA45B]">
              Company & Help
            </h3>
            <ul className="space-y-2.5 text-sm text-[#5B6471] dark:text-[#CBD5E1]">
              <li>
                <Link to="/about" className="hover:text-[#1FA45B] transition-colors">
                  About FitMe
                </Link>
              </li>
              <li>
                <Link to="/about#mission" className="hover:text-[#1FA45B] transition-colors">
                  Our Mission
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#1FA45B] transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/faq#install-guide" className="hover:text-[#1FA45B] transition-colors">
                  Android Install Guide
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#1FA45B] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@fitme.sindulis.com"
                  className="hover:text-[#1FA45B] transition-colors break-all"
                >
                  support@fitme.sindulis.com
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Compliance */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1FA45B]">
              Legal & Privacy
            </h3>
            <ul className="space-y-2.5 text-sm text-[#5B6471] dark:text-[#CBD5E1]">
              <li>
                <Link to="/privacy" className="hover:text-[#1FA45B] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#1FA45B] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/refund" className="hover:text-[#1FA45B] transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/delete-account" className="hover:text-[#1FA45B] transition-colors">
                  Delete Account & Data
                </Link>
              </li>
              <li>
                <span className="text-xs text-[#8C96A5] block pt-1">
                  Compliant with Health Connect and Google Play Health Data Policies.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5B6471] dark:text-[#9AA89E]">
          <p>© 2026 Sindulis Innovative Solutions. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-[#1FA45B] transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-[#1FA45B] transition-colors">
              Terms
            </Link>
            <Link to="/refund" className="hover:text-[#1FA45B] transition-colors">
              Refund
            </Link>
            <Link to="/contact" className="hover:text-[#1FA45B] transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
