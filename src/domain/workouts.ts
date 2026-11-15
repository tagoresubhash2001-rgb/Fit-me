/**
 * Workout calorie estimate: kcal = MET × body weight (kg) × hours (Compendium of Physical Activities).
 * Shown as an estimate in the UI, never as an exact value.
 */
export const MET: Record<string, number> = {
  strength: 5.0,
  cardio: 7.0,
  hiit: 8.0,
  walking: 3.5,
  running: 9.8,
  cycling: 7.5,
  yoga: 2.5,
  stretching: 2.3,
  bodyweight: 3.8,
  other: 4.0,
};

export function estimateWorkoutKcal(category: string, minutes: number, weightKg: number): number {
  const met = MET[category] ?? MET.other;
  return Math.round(met * weightKg * (minutes / 60));
}

/** Estimated calories for a session with several categories, splitting time by number of sets. */
export function estimateSessionKcal(setsByCategory: Record<string, number>, minutes: number, weightKg: number): number {
  const total = Object.values(setsByCategory).reduce((a, b) => a + b, 0);
  if (!total) return estimateWorkoutKcal('other', minutes, weightKg);
  return Object.entries(setsByCategory).reduce((sum, [cat, n]) => sum + estimateWorkoutKcal(cat, (minutes * n) / total, weightKg), 0);
}
