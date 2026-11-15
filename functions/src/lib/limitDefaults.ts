import type { Plan } from './plans';

/**
 * Daily AI usage limits per plan. The final values are an owner decision (PRD section 15,
 * "AI usage limits per tier"); until they are recorded in appConfig/limits these conservative
 * defaults apply. -1 means unlimited, 0 means not allowed.
 */
export const DEFAULT_LIMITS: Record<string, Record<Plan, number>> = {
  coachChat: { free: 0, premium: 0, pro: 60 },
  foodTextAnalysis: { free: 0, premium: 30, pro: 60 },
  foodPhotoScan: { free: 0, premium: 15, pro: 30 },
};
