/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function validateWorkoutDuration(durationMinutes: number): number {
  return Math.max(0, Math.round(durationMinutes));
}

export function validateWorkoutCalories(calories: number): number {
  return Math.max(0, Math.round(calories));
}

export function validateSteps(steps: number): number {
  return Math.max(0, Math.round(steps));
}
