/** Plan tiers (PRD section 2). Pure helpers, unit tested. */
export type Plan = 'free' | 'premium' | 'pro';

const RANK: Record<Plan, number> = { free: 0, premium: 1, pro: 2 };

export interface EntitlementDoc {
  plan?: string;
  /** trialing | active | grace | cancelled | expired (see billing/billing.ts). Missing = legacy grant. */
  status?: string;
  expiresAt?: { toMillis(): number } | number | null;
  source?: string;
}

export function isPlan(v: unknown): v is Plan {
  return v === 'free' || v === 'premium' || v === 'pro';
}

/** Resolves the effective plan: an expired or malformed entitlement is treated as free. */
export function effectivePlan(doc: EntitlementDoc | undefined | null, nowMs: number): Plan {
  if (!doc || !isPlan(doc.plan)) return 'free';
  if (doc.plan === 'free' || doc.status === 'expired') return 'free';
  const exp = doc.expiresAt;
  if (exp === null || exp === undefined) return doc.plan; // non-expiring grant (e.g. lifetime / admin)
  const expMs = typeof exp === 'number' ? exp : exp.toMillis();
  return expMs > nowMs ? doc.plan : 'free';
}

export function planAllows(plan: Plan, required: Plan): boolean {
  return RANK[plan] >= RANK[required];
}

/** Feature → minimum plan. Every premium/pro Cloud Function checks this server-side. */
export const FEATURE_PLAN = {
  micronutrients: 'premium',
  foodPhotoScan: 'premium',
  foodTextAnalysis: 'premium',
  barcodeScan: 'premium',
  coachChat: 'pro',
  planner: 'pro',
  aiPlanner: 'pro',
  mealPlanGenerator: 'pro',
  workoutGenerator: 'pro',
  reminders: 'pro',
  advancedReports: 'pro',
} as const satisfies Record<string, Plan>;

export type Feature = keyof typeof FEATURE_PLAN;
