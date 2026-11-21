
/**
 * Access lifecycle (owner rules, November 2026), shared by the app and Cloud Functions. This file is mirrored
 * byte for byte to functions/src/lib/access.ts (test: access-mirror).
 *
 *   Stage 1, Welcome Unlock: days 1-7 after sign-up, every feature unlocked (default plan: pro).
 *   Stage 2, Free Trial: the next 30 days (days 8-37), the first paid tier (default plan: premium).
 *   Stage 3, after day 37: free tier unless the user subscribes.
 * Dates come from the server-side account creation time, so reinstalling, clearing data or another device
 * never restarts them. One set of free stages per person (see trialRegistry in functions).
 */
export type AccessPlan = 'free' | 'premium' | 'pro';
export type Stage = 'welcome' | 'trial' | 'ended';

const DAY = 86_400_000;
const RANK: Record<AccessPlan, number> = { free: 0, premium: 1, pro: 2 };

/** Admin settings for the stages (schema with validation: accessSchema.ts, loaded only where it is needed). */
export interface AccessConfig {
  /** Bumped by the admin dashboard on every change; stored on each user's access record. */
  version: number;
  welcomeDays: number;
  trialDays: number;
  welcomePlan: 'premium' | 'pro';
  trialPlan: 'premium' | 'pro';
}

export const DEFAULT_ACCESS: AccessConfig = { version: 1, welcomeDays: 7, trialDays: 30, welcomePlan: 'pro', trialPlan: 'premium' };

/** The per-user record (Firestore access/{uid}, written only by Cloud Functions). Times in ms here. */
export interface AccessRecord {
  createdAtMs: number;
  welcomeEndsAtMs: number;
  trialEndsAtMs: number;
  welcomePlan: AccessPlan;
  trialPlan: AccessPlan;
  /** False when this person already had free stages on an earlier account: no free access then. */
  eligible: boolean;
  configVersion: number;
}

export function buildAccess(createdAtMs: number, cfg: AccessConfig, eligible: boolean): AccessRecord {
  const welcomeEndsAtMs = createdAtMs + cfg.welcomeDays * DAY;
  return {
    createdAtMs,
    welcomeEndsAtMs: eligible ? welcomeEndsAtMs : createdAtMs,
    trialEndsAtMs: eligible ? welcomeEndsAtMs + cfg.trialDays * DAY : createdAtMs,
    welcomePlan: cfg.welcomePlan,
    trialPlan: cfg.trialPlan,
    eligible,
    configVersion: cfg.version,
  };
}

export interface StageInfo {
  stage: Stage;
  /** Plan granted by the stage itself (free once the stages are over). */
  plan: AccessPlan;
  /** When the current stage ends (null once ended). */
  endsAtMs: number | null;
  /** Whole days left in the current stage, counting today (0 once ended). */
  daysLeft: number;
  /** What follows: the trial after the welcome stage, then the free tier. */
  next: Stage | null;
  /** 1-based day since sign-up (day 1 is the sign-up day). */
  day: number;
}

export function stageAt(a: AccessRecord | null | undefined, nowMs: number): StageInfo {
  if (!a) return { stage: 'ended', plan: 'free', endsAtMs: null, daysLeft: 0, next: null, day: 0 };
  const day = Math.max(1, Math.floor((nowMs - a.createdAtMs) / DAY) + 1);
  const left = (end: number) => Math.max(0, Math.ceil((end - nowMs) / DAY));
  if (a.eligible && nowMs < a.welcomeEndsAtMs)
    return { stage: 'welcome', plan: a.welcomePlan, endsAtMs: a.welcomeEndsAtMs, daysLeft: left(a.welcomeEndsAtMs), next: a.trialEndsAtMs > a.welcomeEndsAtMs ? 'trial' : 'ended', day };
  if (a.eligible && nowMs < a.trialEndsAtMs) return { stage: 'trial', plan: a.trialPlan, endsAtMs: a.trialEndsAtMs, daysLeft: left(a.trialEndsAtMs), next: 'ended', day };
  return { stage: 'ended', plan: 'free', endsAtMs: null, daysLeft: 0, next: null, day };
}

/** The plan the user can use: the better of their subscription and their free stage. */
export function combinedPlan(subscription: AccessPlan, stage: AccessPlan): AccessPlan {
  return RANK[subscription] >= RANK[stage] ? subscription : stage;
}

/** Reminder due 3 days and 1 day before the current stage ends (key used to send each reminder once). */
export function stageReminderDue(info: StageInfo): { key: string; daysLeft: 3 | 1 } | null {
  if (info.stage === 'ended' || info.endsAtMs === null) return null;
  if (info.daysLeft === 3 || info.daysLeft === 1) return { key: `${info.stage}-${info.endsAtMs}-${info.daysLeft}`, daysLeft: info.daysLeft };
  return null;
}
