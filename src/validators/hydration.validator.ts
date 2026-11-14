/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function validateWaterAmount(value: number): number {
  return Math.max(0, Math.round(value));
}

export function validateDailyHydrationGoal(goal: number): number {
  return Math.max(1000, Math.round(goal)); // reasonable minimum limit
}
