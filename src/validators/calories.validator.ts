/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function validateCalories(value: number): number {
  return Math.max(0, Math.round(value));
}

export function validateMacros(protein: number, carbs: number, fats: number): { protein: number; carbs: number; fats: number } {
  return {
    protein: Math.max(0, Number(protein) || 0),
    carbs: Math.max(0, Number(carbs) || 0),
    fats: Math.max(0, Number(fats) || 0),
  };
}
