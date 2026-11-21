import { describe, expect, it } from 'vitest';
import { buildAccess, combinedPlan, DEFAULT_ACCESS, stageAt, stageReminderDue } from '../access';

const DAY = 86_400_000;
const signUp = Date.UTC(2026, 10, 1, 9, 30); // 1 Nov 2026, 09:30 UTC
const a = buildAccess(signUp, DEFAULT_ACCESS, true);
// "Day N" = the Nth day since sign-up, mid-day.
const day = (n: number) => signUp + (n - 1) * DAY + 3 * 3600_000;

describe('access lifecycle (owner rules: 7-day unlock, 30-day trial, then paid)', () => {
  it('Day 1 and Day 7: Welcome Unlock, every feature (pro)', () => {
    expect(stageAt(a, day(1))).toMatchObject({ stage: 'welcome', plan: 'pro', day: 1, daysLeft: 7, next: 'trial' });
    expect(stageAt(a, day(7))).toMatchObject({ stage: 'welcome', plan: 'pro', day: 7, daysLeft: 1 });
  });
  it('Day 8 and Day 37: free trial of the first paid tier (premium)', () => {
    expect(stageAt(a, day(8))).toMatchObject({ stage: 'trial', plan: 'premium', day: 8, daysLeft: 30, next: 'ended' });
    expect(stageAt(a, day(37))).toMatchObject({ stage: 'trial', plan: 'premium', day: 37, daysLeft: 1 });
  });
  it('Day 38: free plan unless subscribed', () => {
    expect(stageAt(a, day(38))).toMatchObject({ stage: 'ended', plan: 'free', endsAtMs: null, daysLeft: 0 });
  });
  it('boundaries are exact to the millisecond of sign-up', () => {
    expect(stageAt(a, signUp + 7 * DAY - 1).stage).toBe('welcome');
    expect(stageAt(a, signUp + 7 * DAY).stage).toBe('trial');
    expect(stageAt(a, signUp + 37 * DAY - 1).stage).toBe('trial');
    expect(stageAt(a, signUp + 37 * DAY).stage).toBe('ended');
  });
  it('the same account always gives the same dates (reinstall or another device cannot reset them)', () => {
    const again = buildAccess(signUp, DEFAULT_ACCESS, true);
    expect(again).toEqual(a);
  });
  it('no free stages for a person who already had them', () => {
    const repeat = buildAccess(signUp, DEFAULT_ACCESS, false);
    expect(stageAt(repeat, day(1))).toMatchObject({ stage: 'ended', plan: 'free' });
  });
  it('a subscription is never lowered by a stage, and a stage lifts a free user', () => {
    expect(combinedPlan('pro', 'premium')).toBe('pro');
    expect(combinedPlan('premium', 'pro')).toBe('pro');
    expect(combinedPlan('free', 'premium')).toBe('premium');
    expect(combinedPlan('free', 'free')).toBe('free');
  });
  it('configurable lengths and plans', () => {
    const c = buildAccess(signUp, { version: 2, welcomeDays: 3, trialDays: 14, welcomePlan: 'premium', trialPlan: 'premium' }, true);
    expect(stageAt(c, day(3))).toMatchObject({ stage: 'welcome', plan: 'premium' });
    expect(stageAt(c, day(4)).stage).toBe('trial');
    expect(stageAt(c, day(18)).stage).toBe('ended');
    const noWelcome = buildAccess(signUp, { version: 3, welcomeDays: 0, trialDays: 30, welcomePlan: 'pro', trialPlan: 'premium' }, true);
    expect(stageAt(noWelcome, day(1)).stage).toBe('trial');
  });
  it('reminders 3 days and 1 day before each stage ends, once per key', () => {
    expect(stageReminderDue(stageAt(a, day(5)))).toMatchObject({ daysLeft: 3 });
    expect(stageReminderDue(stageAt(a, day(7)))).toMatchObject({ daysLeft: 1 });
    expect(stageReminderDue(stageAt(a, day(6)))).toBeNull();
    expect(stageReminderDue(stageAt(a, day(35)))).toMatchObject({ daysLeft: 3 });
    expect(stageReminderDue(stageAt(a, day(37)))?.key).toMatch(/^trial-/);
    expect(stageReminderDue(stageAt(a, day(38)))).toBeNull();
    expect(stageAt(null, day(1)).stage).toBe('ended');
  });
});
