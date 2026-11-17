/**
 * Health target calculations (CLAUDE.md "Calculations", PRD section 7 module 1).
 * Validated formulas only; every function here is unit tested.
 */
export type CalcSex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';
export type Goal = 'lose' | 'gain' | 'maintain' | 'build_muscle' | 'improve_fitness' | 'wellness' | 'eating_habits';

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

/** Tunable values; the defaults match CLAUDE.md and can be overridden from appConfig/targets. */
export interface TargetConfig {
  loseDeltaKcal: number;
  gainDeltaKcal: number;
  floorFemaleKcal: number;
  floorMaleKcal: number;
  proteinGPerKg: number;
  fatShare: number; // share of calories from fat, 0.25–0.30
  fiberGPer1000Kcal: number;
  waterMlPerKg: number;
}

export const DEFAULT_TARGET_CONFIG: TargetConfig = {
  loseDeltaKcal: 500,
  gainDeltaKcal: 300,
  floorFemaleKcal: 1200,
  floorMaleKcal: 1500,
  proteinGPerKg: 1.6,
  fatShare: 0.275,
  fiberGPer1000Kcal: 14,
  waterMlPerKg: 35,
};

export interface BodyInput {
  sex: CalcSex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
}

export interface Targets {
  bmi: number;
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  waterMl: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return round1(weightKg / (m * m));
}

export type BmiBand = 'under' | 'healthy' | 'over' | 'obese';
export function bmiBand(value: number): BmiBand {
  if (value < 18.5) return 'under';
  if (value < 25) return 'healthy';
  if (value < 30) return 'over';
  return 'obese';
}

/** Mifflin-St Jeor: 10·kg + 6.25·cm − 5·age + 5 (male) or − 161 (female). */
export function bmrMifflinStJeor(sex: CalcSex, weightKg: number, heightCm: number, ageYears: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + (sex === 'male' ? 5 : -161);
}

export function tdee(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activity];
}

export function calorieMode(goal: Goal): 'lose' | 'gain' | 'maintain' {
  if (goal === 'lose') return 'lose';
  if (goal === 'gain' || goal === 'build_muscle') return 'gain';
  return 'maintain'; // maintain, fitness, wellness, eating habits, sleep, stress, energy
}

export function goalCalories(tdeeKcal: number, goal: Goal, sex: CalcSex, cfg: TargetConfig = DEFAULT_TARGET_CONFIG): number {
  const mode = calorieMode(goal);
  if (mode === 'lose') {
    const floor = sex === 'female' ? cfg.floorFemaleKcal : cfg.floorMaleKcal;
    return Math.max(floor, Math.round(tdeeKcal - cfg.loseDeltaKcal));
  }
  if (mode === 'gain') return Math.round(tdeeKcal + cfg.gainDeltaKcal);
  return Math.round(tdeeKcal);
}

export function validateBody(b: BodyInput): string[] {
  const errors: string[] = [];
  if (!(b.ageYears >= 13 && b.ageYears <= 100)) errors.push('age');
  if (!(b.heightCm >= 100 && b.heightCm <= 250)) errors.push('height');
  if (!(b.weightKg >= 25 && b.weightKg <= 350)) errors.push('weight');
  return errors;
}

export function calculateTargets(b: BodyInput, cfg: TargetConfig = DEFAULT_TARGET_CONFIG): Targets {
  const errors = validateBody(b);
  if (errors.length) throw new RangeError(`invalid_${errors.join('_')}`);
  const bmr = bmrMifflinStJeor(b.sex, b.weightKg, b.heightCm, b.ageYears);
  const t = tdee(bmr, b.activity);
  const calories = goalCalories(t, b.goal, b.sex, cfg);
  const proteinG = Math.round(b.weightKg * cfg.proteinGPerKg);
  const fatG = Math.round((calories * cfg.fatShare) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  const fiberG = Math.round((calories / 1000) * cfg.fiberGPer1000Kcal);
  const waterMl = Math.round((b.weightKg * cfg.waterMlPerKg) / 50) * 50;
  return { bmi: bmi(b.weightKg, b.heightCm), bmr: Math.round(bmr), tdee: Math.round(t), calories, proteinG, fatG, carbsG, fiberG, waterMl };
}

export function ageFromBirthYear(birthYear: number, now = new Date()): number {
  return now.getFullYear() - birthYear;
}
