import { describe, expect, it } from 'vitest';
import {
  bmi,
  bmiBand,
  bmrMifflinStJeor,
  tdee,
  goalCalories,
  calculateTargets,
  calorieMode,
  DEFAULT_TARGET_CONFIG,
  ACTIVITY_FACTORS,
} from '../calculators';

describe('Mifflin-St Jeor BMR', () => {
  it('male: 10·kg + 6.25·cm − 5·age + 5', () => {
    expect(bmrMifflinStJeor('male', 80, 180, 30)).toBe(800 + 1125 - 150 + 5); // 1780
  });
  it('female: … − 161', () => {
    expect(bmrMifflinStJeor('female', 60, 165, 25)).toBe(600 + 1031.25 - 125 - 161); // 1345.25
  });
});

describe('TDEE', () => {
  it('uses the five PRD activity factors', () => {
    expect(ACTIVITY_FACTORS).toEqual({ sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, extra: 1.9 });
    expect(tdee(1780, 'moderate')).toBeCloseTo(2759, 0);
    expect(tdee(1000, 'extra')).toBeCloseTo(1900, 5);
  });
});

describe('goal calories', () => {
  it('lose = TDEE − 500, gain = TDEE + 300, maintain = TDEE', () => {
    expect(goalCalories(2500, 'lose', 'male')).toBe(2000);
    expect(goalCalories(2500, 'gain', 'male')).toBe(2800);
    expect(goalCalories(2500, 'build_muscle', 'female')).toBe(2800);
    expect(goalCalories(2500, 'maintain', 'female')).toBe(2500);
    expect(goalCalories(2500, 'wellness', 'female')).toBe(2500);
  });
  it('applies the 1200 F / 1500 M floors when losing', () => {
    expect(goalCalories(1500, 'lose', 'female')).toBe(1200);
    expect(goalCalories(1800, 'lose', 'male')).toBe(1500);
    expect(goalCalories(1650, 'lose', 'female')).toBe(1200);
    expect(goalCalories(1750, 'lose', 'female')).toBe(1250);
  });
  it('uses configurable deltas', () => {
    expect(goalCalories(2500, 'lose', 'male', { ...DEFAULT_TARGET_CONFIG, loseDeltaKcal: 400 })).toBe(2100);
  });
  it('maps goals to calorie modes', () => {
    expect(calorieMode('improve_fitness')).toBe('maintain');
    expect(calorieMode('eating_habits')).toBe('maintain');
  });
});

describe('BMI', () => {
  it('kg / m², one decimal', () => {
    expect(bmi(70, 175)).toBe(22.9);
    expect(bmiBand(17)).toBe('under');
    expect(bmiBand(22.9)).toBe('healthy');
    expect(bmiBand(27)).toBe('over');
    expect(bmiBand(31)).toBe('obese');
  });
});

describe('calculateTargets (worked example)', () => {
  // Male, 30 y, 180 cm, 80 kg, moderate, lose.
  // BMR 1780; TDEE 1780 × 1.55 = 2759; calories 2259.
  // Protein 1.6 × 80 = 128 g; fat 2259 × 0.275 / 9 = 69.0 → 69 g;
  // carbs (2259 − 512 − 621) / 4 = 281.5 → 282 g; fiber 2.259 × 14 = 31.6 → 32 g; water 80 × 35 = 2800 ml.
  it('matches the hand calculation', () => {
    const t = calculateTargets({ sex: 'male', ageYears: 30, heightCm: 180, weightKg: 80, activity: 'moderate', goal: 'lose' });
    expect(t).toEqual({
      bmi: 24.7,
      bmr: 1780,
      tdee: 2759,
      calories: 2259,
      proteinG: 128,
      fatG: 69,
      carbsG: 282,
      fiberG: 32,
      waterMl: 2800,
    });
  });
  it('female maintain example', () => {
    // BMR 1345.25; TDEE × 1.2 = 1614.3 → 1614 kcal.
    const t = calculateTargets({ sex: 'female', ageYears: 25, heightCm: 165, weightKg: 60, activity: 'sedentary', goal: 'maintain' });
    expect(t.bmr).toBe(1345);
    expect(t.calories).toBe(1614);
    expect(t.proteinG).toBe(96);
    expect(t.waterMl).toBe(2100);
    expect(t.fiberG).toBe(23);
  });
  it('never returns negative carbs', () => {
    const t = calculateTargets(
      { sex: 'female', ageYears: 60, heightCm: 150, weightKg: 140, activity: 'sedentary', goal: 'lose' },
      { ...DEFAULT_TARGET_CONFIG, proteinGPerKg: 2.5 },
    );
    expect(t.carbsG).toBeGreaterThanOrEqual(0);
  });
  it('rejects out-of-range input instead of guessing', () => {
    expect(() => calculateTargets({ sex: 'male', ageYears: 8, heightCm: 180, weightKg: 80, activity: 'light', goal: 'lose' })).toThrow(
      /invalid_age/,
    );
    expect(() => calculateTargets({ sex: 'male', ageYears: 30, heightCm: 20, weightKg: 80, activity: 'light', goal: 'lose' })).toThrow(
      /height/,
    );
  });
});
