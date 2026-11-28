import React from 'react';
import { Link } from 'react-router-dom';
import { WebsiteLayout } from '../website/WebsiteLayout';

export default function PrivacyPage() {
  return (
    <WebsiteLayout
      title="Privacy Policy & Health Data Governance | FitMe"
      description="FitMe Health Data Privacy Policy: what biometric telemetry we collect, how it is encrypted, stored, and your rights to access or delete it."
    >
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-10 text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1FA45B]/25 bg-[#F0FDF4] dark:bg-[#1FA45B]/15 px-3 py-1 text-xs font-semibold text-[#1FA45B]">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
            <span>Health Data Privacy & Protection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#11181C] dark:text-white">
            Privacy Policy & Health Data Governance
          </h1>
          <p className="text-sm text-[#5B6471] dark:text-[#9AA89E]">
            Effective Date: November 27, 2026 · Sindulis Innovative Solutions
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-[#5B6471] dark:text-[#CBD5E1]">
          <section className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#FBFDFB] dark:bg-[#171D18] p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-bold text-[#11181C] dark:text-white flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#1FA45B]" />
              1. Our Commitment to Your Health Privacy
            </h2>
            <p>
              FitMe (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is operated by Sindulis Innovative Solutions. Your health and fitness data is sensitive, personal, and entirely yours. We believe health telemetry should empower you—never be weaponized for advertising, rented, or sold. This Privacy Policy details exactly what data we collect, how we process it, where it is stored, and your unconditional right to delete it.
            </p>
          </section>

          <section className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#FBFDFB] dark:bg-[#171D18] p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-bold text-[#11181C] dark:text-white flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#1FA45B]" />
              2. What Health Data We Collect
            </h2>
            <p>
              When you use FitMe and authorize health permissions, we collect only the specific metrics required to provide accurate tracking and AI coaching:
            </p>
            <ul className="list-disc pl-5 space-y-2 pt-1 text-xs sm:text-sm">
              <li><strong>Step Counting &amp; Cadence:</strong> Steps, walking/running distance, and active calorie expenditure collected via the Google Health Connect client or native device hardware step sensors.</li>
              <li><strong>Heart Rate Telemetry:</strong> Resting heart rate baselines and active workout heart rate zones synchronized from connected wearables or manually logged.</li>
              <li><strong>Diet &amp; Nutrition:</strong> Food items logged, macronutrient splits (protein, carbohydrates, dietary fats, fiber), and total caloric intake.</li>
              <li><strong>Hydration &amp; Sleep:</strong> Water logs, sleep duration, and sleep quality scores to calculate recovery and adapt daily workout targets.</li>
              <li><strong>Workouts &amp; GPS Telemetry:</strong> Route coordinates, duration, pace, and elevation during user-initiated outdoor exercise sessions.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#FBFDFB] dark:bg-[#171D18] p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-bold text-[#11181C] dark:text-white flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#1FA45B]" />
              3. Compliance with Google Health Connect &amp; Android Policies
            </h2>
            <p>
              FitMe strictly complies with the Google Health Connect Developer Policy. Specifically:
            </p>
            <ul className="list-disc pl-5 space-y-2 pt-1 text-xs sm:text-sm">
              <li>Health Connect data is <strong>never</strong> transferred to third parties or advertising networks.</li>
              <li>Health Connect data is <strong>never</strong> used for creditworthiness, insurance underwriting, or advertising profiling.</li>
              <li>Data is processed strictly to display your personal health analytics and empower your AI fitness coach.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#FBFDFB] dark:bg-[#171D18] p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-bold text-[#11181C] dark:text-white flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#1FA45B]" />
              4. Storage, Security &amp; Encryption
            </h2>
            <p>
              Your personal data is encrypted in transit using TLS 1.3 and at rest in Google Firebase Cloud storage. Access is enforced by role-based authentication rules. Only your authenticated user account can access your health records.
            </p>
          </section>

          <section className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#FBFDFB] dark:bg-[#171D18] p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-bold text-[#11181C] dark:text-white flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#1FA45B]" />
              5. Your Right to Delete Account &amp; Telemetry
            </h2>
            <p>
              You maintain full ownership of your data. You may export or permanently delete your account and all stored health telemetry at any time.
            </p>
            <div className="pt-2">
              <Link
                to="/delete-account"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#1FA45B] hover:underline"
              >
                <span>Go to Account Deletion Request Page</span>
                <span>→</span>
              </Link>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-[#FBFDFB] dark:bg-[#171D18] p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-bold text-[#11181C] dark:text-white flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#1FA45B]" />
              6. Contacting the Privacy Officer
            </h2>
            <p>
              For privacy inquiries, audit requests, or data protection questions:
            </p>
            <div className="text-xs text-[#11181C] dark:text-white space-y-1">
              <div><strong>Sindulis Innovative Solutions</strong></div>
              <div>Official Privacy Desk: <a href="mailto:support@fitme.sindulis.com" className="text-[#1FA45B] hover:underline">support@fitme.sindulis.com</a></div>
            </div>
          </section>
        </div>
      </div>
    </WebsiteLayout>
  );
}
