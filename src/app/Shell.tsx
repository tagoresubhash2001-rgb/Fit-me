import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, CalendarDays, HeartPulse, Dumbbell, ShoppingBag, MessageCircle, WifiOff } from 'lucide-react';
import { cn } from '../components/ui';
import { useSession } from '../data/session';
import { useOnline } from '../lib/hooks';
import { CoachSheet } from '../features/coach/CoachSheet';
import { NovaBar } from './NovaBar';

const TABS = [
  { to: '/', key: 'home', icon: Home, end: true },
  { to: '/planner', key: 'planner', icon: CalendarDays },
  { to: '/health', key: 'health', icon: HeartPulse },
  { to: '/workouts', key: 'workouts', icon: Dumbbell },
  { to: '/store', key: 'store', icon: ShoppingBag },
] as const;

export function Shell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile);
  const online = useOnline();
  const [coachOpen, setCoachOpen] = useState(false);

  return (
    <div className="relative min-h-dvh bg-canvas pb-36 text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <span className="text-title font-semibold text-ink">
            FIT ME <span className="text-primary">AI</span>
          </span>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-small font-semibold text-on-primary transition-transform duration-150 active:scale-95"
            aria-label={`${t('nav.profile')}, ${t('nav.settings')}`}
          >
            {profile?.name?.[0]?.toUpperCase() ?? '?'}
          </button>
        </div>
        {!online && (
          <p
            role="status"
            className="mx-auto mt-2 flex max-w-2xl items-center gap-2 rounded-input bg-accent-subtle px-3 py-2 text-caption text-accent"
          >
            <WifiOff className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {t('common.offline')}
          </p>
        )}
      </header>

      <NovaBar />

      <main className="mx-auto max-w-2xl px-4 pt-4">
        <Outlet />
      </main>

      <button
        id="coach-button"
        type="button"
        onClick={() => setCoachOpen(true)}
        aria-label={t('coach.open')}
        className="fixed bottom-[calc(max(12px,env(safe-area-inset-bottom))+84px)] end-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-float transition-[background-color,transform] duration-150 hover:bg-primary-pressed active:scale-95"
      >
        <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
      </button>
      <CoachSheet open={coachOpen} onClose={() => setCoachOpen(false)} />

      <nav
        aria-label={t('nav.main')}
        className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-50 mx-auto max-w-lg rounded-card border border-line bg-nav p-1.5 shadow-float"
      >
        <ul className="flex items-stretch justify-between gap-1">
          {TABS.map(({ to, key, icon: Icon, ...rest }) => (
            <li key={key} className="min-w-0 flex-1">
              <NavLink
                to={to}
                end={'end' in rest}
                id={`nav-${key}`}
                className="group flex w-full flex-col items-center gap-0.5 rounded-button py-1"
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-8 w-14 max-w-full items-center justify-center rounded-full transition-colors duration-150',
                        isActive ? 'bg-primary-subtle text-primary' : 'text-muted group-hover:text-ink',
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className={cn('max-w-full truncate text-caption', isActive ? 'text-primary' : 'text-muted')}>
                      {t(`nav.${key}`)}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
