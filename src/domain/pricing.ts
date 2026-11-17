import type { Plan } from './plans';

/** Monthly prices from PRD section 2. Other countries use the app stores' local price tiers. */
export const MONTHLY_PRICES: Record<string, Record<Exclude<Plan, 'free'>, number>> = {
  INR: { premium: 199, pro: 399 },
  USD: { premium: 9, pro: 29 },
  GBP: { premium: 9, pro: 29 },
  EUR: { premium: 9, pro: 29 },
};

export function monthlyPrice(currency: string, plan: Exclude<Plan, 'free'>): number | null {
  return MONTHLY_PRICES[currency]?.[plan] ?? null;
}

export function formatPrice(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount);
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
