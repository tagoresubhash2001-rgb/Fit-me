/** Client-side mirror of plan tiers for display only. Enforcement happens in Cloud Functions. */
export type Plan = 'free' | 'premium' | 'pro';
const RANK: Record<Plan, number> = { free: 0, premium: 1, pro: 2 };
export const planAllows = (plan: Plan, required: Plan) => RANK[plan] >= RANK[required];

export function effectivePlan(doc: { plan?: string; status?: string; expiresAt?: { toMillis(): number } | null } | undefined, nowMs: number): Plan {
  const p = doc?.plan;
  if (p !== 'premium' && p !== 'pro') return 'free';
  // Cancelled keeps access until the end of the trial or paid period; expired never does.
  if (doc?.status === 'expired') return 'free';
  if (!doc?.expiresAt) return p;
  return doc.expiresAt.toMillis() > nowMs ? p : 'free';
}
