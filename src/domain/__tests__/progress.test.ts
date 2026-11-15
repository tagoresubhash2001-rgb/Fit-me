import { describe, expect, it } from 'vitest';
import { currentStreak, longestStreak, earnedBadges, movingAverage, isPlateau, sleepMinutes } from '../progress';
import { estimateWorkoutKcal, estimateSessionKcal } from '../workouts';
import {
  scaleNutrients,
  sumNutrients,
  isLikelyDuplicate,
  slotForMinutes,
  searchTokens,
  normalize,
  rankFoods,
  type FoodItem,
} from '../nutrition';
import { dateRange } from '../dates';

describe('streaks', () => {
  it('counts back from today, or from yesterday when today is not logged yet', () => {
    expect(currentStreak(['2026-11-12', '2026-11-13', '2026-11-14'], '2026-11-14')).toBe(3);
    expect(currentStreak(['2026-11-12', '2026-11-13'], '2026-11-14')).toBe(2);
    expect(currentStreak(['2026-11-10'], '2026-11-14')).toBe(0);
    expect(longestStreak(['2026-01-01', '2026-01-02', '2026-01-05', '2026-01-06', '2026-01-07'])).toBe(3);
  });
  it('badges', () => {
    const week = dateRange('2026-11-01', '2026-11-07');
    const b = earnedBadges({ foodDays: week, waterGoalDays: week, workoutCount: 5, loggingDays: week, sleepGoodNights: week.slice(0, 3) });
    expect(b).toEqual({
      first_log: true,
      hydration_7: true,
      workouts_5: true,
      consistency_30: false,
      meals_week: true,
      sleep_routine: false,
    });
  });
});

describe('weight trend', () => {
  it('7-day moving average uses the latest value per day', () => {
    const avg = movingAverage([
      { date: '2026-11-01', value: 80 },
      { date: '2026-11-02', value: 81 },
      { date: '2026-11-02', value: 79 },
    ]);
    expect(avg).toEqual([
      { date: '2026-11-01', avg: 80 },
      { date: '2026-11-02', avg: 79.5 },
    ]);
  });
  it('detects a plateau over two weeks and not a steady loss', () => {
    const flat = dateRange('2026-10-25', '2026-11-14').map((date, i) => ({ date, value: 80 + (i % 2 ? 0.2 : -0.2) }));
    expect(isPlateau(flat, '2026-11-14')).toBe(true);
    const losing = dateRange('2026-10-25', '2026-11-14').map((date, i) => ({ date, value: 80 - i * 0.1 }));
    expect(isPlateau(losing, '2026-11-14')).toBe(false);
    expect(isPlateau(flat.slice(-5), '2026-11-14')).toBe(false);
  });
  it('sleep duration crosses midnight', () => {
    expect(sleepMinutes(23 * 60, 7 * 60)).toBe(480);
    expect(sleepMinutes(60, 8 * 60)).toBe(420);
  });
});

describe('workout calories', () => {
  it('MET × kg × hours', () => {
    expect(estimateWorkoutKcal('running', 30, 70)).toBe(343);
    expect(estimateWorkoutKcal('unknown', 60, 50)).toBe(200);
    expect(estimateSessionKcal({ strength: 3, cardio: 1 }, 40, 80)).toBe(Math.round(5 * 80 * 0.5) + Math.round(7 * 80 * (10 / 60)));
  });
});

describe('nutrition', () => {
  const per100g = { calories: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, fiberG: 0.4, sodiumMg: 1 };
  it('scales per-100 g values', () => {
    expect(scaleNutrients(per100g, 150)).toEqual({ calories: 195, proteinG: 4.1, carbsG: 42, fatG: 0.5, fiberG: 0.6, sodiumMg: 2 });
  });
  it('sums nutrients', () => {
    expect(sumNutrients([scaleNutrients(per100g, 100), scaleNutrients(per100g, 100)]).calories).toBe(260);
  });
  it('detects duplicates within 10 minutes only', () => {
    const now = 1_000_000_000;
    const ex = [{ foodId: 'f1', name: 'Idli', slot: 'breakfast' as const, createdAtMs: now - 5 * 60_000 }];
    expect(isLikelyDuplicate(ex, { foodId: 'f1', name: 'Idli', slot: 'breakfast' }, now)).toBe(true);
    expect(isLikelyDuplicate(ex, { foodId: 'f1', name: 'Idli', slot: 'lunch' }, now)).toBe(false);
    expect(isLikelyDuplicate(ex, { foodId: 'f1', name: 'Idli', slot: 'breakfast' }, now + 20 * 60_000)).toBe(false);
  });
  it('default slot by time of day', () => {
    expect(slotForMinutes(8 * 60)).toBe('breakfast');
    expect(slotForMinutes(13 * 60)).toBe('lunch');
    expect(slotForMinutes(20 * 60)).toBe('dinner');
  });
  it('search tokens and normalisation, including Indic scripts', () => {
    expect(normalize('Crème Brûlée!')).toBe('creme brulee');
    expect(searchTokens(['Masala Dosa'])).toEqual(expect.arrayContaining(['ma', 'mas', 'masala', 'do', 'dosa']));
    expect(searchTokens(['ఇడ్లీ']).length).toBeGreaterThan(0);
  });
  it('ranks local dishes and exact matches first', () => {
    const f = (id: string, name: string, extra: Partial<FoodItem> = {}): FoodItem => ({
      id,
      name,
      per100g: per100g,
      servings: [],
      source: 'usda',
      ...extra,
    });
    const items = [f('a', 'Rice, white, cooked'), f('b', 'Dosa, plain', { source: 'curated', countries: ['IN'] }), f('c', 'Dosa')];
    expect(rankFoods(items, 'dosa', 'IN', 'en').map((x) => x.id)).toEqual(['b', 'c', 'a']);
    expect(rankFoods(items, 'dosa', 'US', 'en')[0].id).toBe('c');
    const rice = [f('w', 'Wild rice, cooked'), f('r', 'Rice, white, long-grain, regular, cooked')];
    expect(rankFoods(rice, 'rice cooked', 'US', 'en')[0].id).toBe('r');
  });
});
