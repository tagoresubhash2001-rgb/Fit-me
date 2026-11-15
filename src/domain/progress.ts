import { addDays } from './dates';

/** Consecutive days ending today (or yesterday, so a streak is not lost before the day ends). */
export function currentStreak(datesWithActivity: Iterable<string>, today: string): number {
  const set = new Set(datesWithActivity);
  let day = set.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

export function longestStreak(dates: Iterable<string>): number {
  const sorted = [...new Set(dates)].sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export interface BadgeInput {
  foodDays: string[];
  waterGoalDays: string[];
  workoutCount: number;
  loggingDays: string[];
  sleepGoodNights: string[]; // dates with >= 7 h sleep
}

export type BadgeId = 'first_log' | 'hydration_7' | 'workouts_5' | 'consistency_30' | 'meals_week' | 'sleep_routine';

export function earnedBadges(b: BadgeInput): Record<BadgeId, boolean> {
  return {
    first_log: b.foodDays.length > 0,
    hydration_7: longestStreak(b.waterGoalDays) >= 7,
    workouts_5: b.workoutCount >= 5,
    consistency_30: longestStreak(b.loggingDays) >= 30,
    meals_week: longestStreak(b.foodDays) >= 7,
    sleep_routine: longestStreak(b.sleepGoodNights) >= 7,
  };
}

/** Trailing moving average over calendar days (uses the latest value of each day). */
export function movingAverage(points: Array<{ date: string; value: number }>, days = 7): Array<{ date: string; avg: number }> {
  const byDay = new Map<string, number>();
  for (const p of [...points].sort((a, b) => a.date.localeCompare(b.date))) byDay.set(p.date, p.value);
  const dates = [...byDay.keys()];
  return dates.map((d) => {
    const from = addDays(d, -(days - 1));
    const window = dates.filter((x) => x >= from && x <= d).map((x) => byDay.get(x)!);
    return { date: d, avg: Math.round((window.reduce((a, v) => a + v, 0) / window.length) * 10) / 10 };
  });
}

/**
 * Plateau: at least 14 days of data and the 7-day average changed by less than `tolerance` kg
 * across the last 14 days.
 */
export function isPlateau(points: Array<{ date: string; value: number }>, today: string, tolerance = 0.3): boolean {
  const avg = movingAverage(points, 7);
  if (avg.length < 2) return false;
  const start = addDays(today, -14);
  const recent = avg.filter((a) => a.date >= start);
  const first = avg.filter((a) => a.date <= start).pop() ?? recent[0];
  if (!first || recent.length < 4 || first.date > addDays(start, 2)) return false;
  const last = recent[recent.length - 1];
  return Math.abs(last.avg - first.avg) < tolerance;
}

export function sleepMinutes(startMinutes: number, endMinutes: number): number {
  return (endMinutes - startMinutes + 24 * 60) % (24 * 60);
}
