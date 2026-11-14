import React from 'react';
import { Home, CalendarDays, HeartPulse, Dumbbell, ShoppingBag } from 'lucide-react';
import { cn } from './ui';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// PRD section 7: Home, Planner, Health, Workouts, Store. Profile and Settings open from the header avatar.
const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'planner', label: 'Planner', icon: CalendarDays },
  { id: 'trackings', label: 'Health', icon: HeartPulse },
  { id: 'workout', label: 'Workouts', icon: Dumbbell },
  { id: 'store', label: 'Store', icon: ShoppingBag },
] as const;

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-50 mx-auto max-w-lg rounded-card border border-line bg-nav px-1.5 py-1.5 shadow-float"
    >
      <ul className="flex items-stretch justify-between gap-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <li key={id} className="min-w-0 flex-1">
              <button
                id={`nav-tab-${id}`}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={active ? 'page' : undefined}
                className="group flex w-full flex-col items-center gap-0.5 rounded-button py-1 transition-colors duration-150"
              >
                <span
                  className={cn(
                    'flex h-8 w-14 max-w-full items-center justify-center rounded-full transition-colors duration-150',
                    active ? 'bg-primary-subtle text-primary' : 'text-muted group-hover:text-ink',
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className={cn('max-w-full truncate text-caption', active ? 'text-primary' : 'text-muted')}>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
