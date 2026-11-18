import type { Plan } from './plans';

// Prices come from appConfig/pricing via src/domain/billing.ts (PRD section 2); none are hard-coded here.

export function formatPrice(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount);
}

/** Feature rows for the comparison table (PRD section 2), with the lowest plan that includes each. */
export const PLAN_FEATURES: Array<{ id: string; plans: Plan[] }> = [
  { id: 'macros', plans: ['free', 'premium', 'pro'] },
  { id: 'steps', plans: ['free', 'premium', 'pro'] },
  { id: 'trackers', plans: ['free', 'premium', 'pro'] },
  { id: 'workouts', plans: ['free', 'premium', 'pro'] },
  { id: 'micros', plans: ['premium', 'pro'] },
  { id: 'photoScan', plans: ['premium', 'pro'] },
  { id: 'coach', plans: ['pro'] },
  { id: 'reminders', plans: ['pro'] },
  { id: 'planner', plans: ['pro'] },
  { id: 'generators', plans: ['pro'] },
  { id: 'reports', plans: ['pro'] },
  { id: 'noAds', plans: ['premium', 'pro'] },
];
