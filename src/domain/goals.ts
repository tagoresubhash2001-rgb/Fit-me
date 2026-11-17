import type { ActivityLevel, Goal } from './calculators';

/** Goals the user can pick (owner correction 3). One is primary and drives the calorie target. */
export const GOAL_IDS = ['lose', 'gain', 'maintain', 'build_muscle', 'improve_fitness', 'eat_healthier', 'sleep_better', 'reduce_stress', 'improve_energy'] as const;
export type GoalId = (typeof GOAL_IDS)[number];

/** Goals that change body weight and therefore the calorie target. */
export const WEIGHT_GOALS: GoalId[] = ['lose', 'gain', 'maintain', 'build_muscle'];

const CONFLICTS: Array<[GoalId, GoalId]> = [
  ['lose', 'gain'],
  ['lose', 'maintain'],
  ['gain', 'maintain'],
];

export function conflictWith(goal: GoalId, selected: GoalId[]): GoalId | null {
  for (const [a, b] of CONFLICTS) {
    if (goal === a && selected.includes(b)) return b;
    if (goal === b && selected.includes(a)) return a;
  }
  return null;
}

export interface Recommendation {
  goal: GoalId;
  reason: 'bmiHigh' | 'bmiLow' | 'bmiHealthy' | 'lowActivity' | 'ageStrength' | 'activeMuscle';
}

/** Suggestions from BMI, age and activity. Advice for wellness, not a diagnosis. */
export function recommendGoals(bmi: number | null, ageYears: number | null, activity: ActivityLevel | null): Recommendation[] {
  const out: Recommendation[] = [];
  if (bmi !== null && Number.isFinite(bmi)) {
    if (bmi >= 25) out.push({ goal: 'lose', reason: 'bmiHigh' });
    else if (bmi < 18.5) out.push({ goal: 'gain', reason: 'bmiLow' });
    else out.push({ goal: 'maintain', reason: 'bmiHealthy' });
  }
  if (activity === 'sedentary' || activity === 'light') out.push({ goal: 'improve_fitness', reason: 'lowActivity' });
  if (ageYears !== null && ageYears >= 40) out.push({ goal: 'build_muscle', reason: 'ageStrength' });
  else if (activity === 'very' || activity === 'extra') out.push({ goal: 'build_muscle', reason: 'activeMuscle' });
  return out.filter((r, i, a) => a.findIndex((x) => x.goal === r.goal) === i);
}

/** Maps the primary goal to the calorie calculator's goal. */
export function calorieGoalFor(primary: GoalId): Goal {
  switch (primary) {
    case 'lose':
    case 'gain':
    case 'maintain':
    case 'build_muscle':
    case 'improve_fitness':
      return primary;
    case 'eat_healthier':
      return 'eating_habits';
    default:
      return 'wellness';
  }
}

/** Picks a valid primary goal: keeps the current one if still selected, else the first weight goal, else the first goal. */
export function normalizePrimary(selected: GoalId[], primary: GoalId | null): GoalId | null {
  if (primary && selected.includes(primary)) return primary;
  return selected.find((g) => WEIGHT_GOALS.includes(g)) ?? selected[0] ?? null;
}
