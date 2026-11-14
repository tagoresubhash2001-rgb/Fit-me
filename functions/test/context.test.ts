import { describe, expect, it } from 'vitest';
import { summarizeContext } from '../src/ai/context';
import { localDate, daysBefore } from '../src/lib/time';
import { dayKey, overLimit } from '../src/lib/rateLimit';

describe('summarizeContext', () => {
  it('says so when there is no profile', () => {
    expect(summarizeContext({ profile: null, today: '2026-11-14', logs: {} })).toMatch(/No profile yet/);
  });
  it('summarises only real logs and says when there are none', () => {
    const s = summarizeContext({
      profile: { name: 'Ravi', goal: 'lose', dietType: 'vegetarian', country: 'IN', targets: { calories: 1900, proteinG: 120, carbsG: 210, fatG: 60, fiberG: 27, waterMl: 2700 } },
      today: '2026-11-14',
      logs: {
        foodLogs: [
          { date: '2026-11-14', calories: 300, proteinG: 10 },
          { date: '2026-11-14', calories: 200, proteinG: 5 },
          { date: '2026-11-13', calories: 1500, proteinG: 70 },
        ],
        waterLogs: [{ date: '2026-11-14', ml: 750 }],
        workoutLogs: [],
      },
    });
    expect(s).toContain('1900 kcal');
    expect(s).toContain('500 kcal eaten, 15 g protein, 750 ml water');
    expect(s).toContain('Food logged on 2 of the last 7 days');
    expect(s).toContain('No workouts logged');
  });
});
describe('time and limits', () => {
  it('computes local dates in the user time zone', () => {
    const t = Date.UTC(2026, 10, 14, 20, 0); // 20:00 UTC
    expect(localDate(t, 'Asia/Kolkata')).toBe('2026-11-15');
    expect(localDate(t, 'America/New_York')).toBe('2026-11-14');
    expect(localDate(t, 'Not/AZone')).toBe('2026-11-14');
    expect(daysBefore('2026-03-01', 1)).toBe('2026-02-28');
  });
  it('rate limit helpers', () => {
    expect(dayKey(Date.UTC(2026, 0, 5))).toBe('20260105');
    expect(overLimit(5, 5)).toBe(true);
    expect(overLimit(4, 5)).toBe(false);
    expect(overLimit(0, 0)).toBe(true);
    expect(overLimit(1000, -1)).toBe(false);
  });
});
