import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DynamicIslandNavbar } from './DynamicIslandNavbar';
import { WebsiteFooter } from './WebsiteFooter';

interface WebsiteLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function WebsiteLayout({
  children,
  title = 'FitMe – For a Healthier Life.',
  description = 'FitMe – For a Healthier Life. Native health and fitness tracking with Health Connect, step counting, heart rate telemetry, macro nutrition, and AI coaching.',
}: WebsiteLayoutProps) {
  const location = useLocation();

  // Scroll to top on page route transition
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Update document title and description
  useEffect(() => {
    document.title = title;
    const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = description;
    }
  }, [title, description]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#111613] text-[#11181C] dark:text-[#E2E8F0] selection:bg-[#1FA45B] selection:text-white font-sans antialiased overflow-x-hidden flex flex-col">
      {/* Floating Dynamic Island Navbar */}
      <DynamicIslandNavbar />

      {/* Main Page Content */}
      <main className="flex-1 pt-24 sm:pt-28">
        {children}
      </main>

      {/* Global Shared Footer */}
      <WebsiteFooter />
    </div>
  );
}
