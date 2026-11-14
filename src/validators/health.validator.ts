/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function validateBloodSugar(glucose: number): number {
  return Math.min(600, Math.max(10, Math.round(glucose)));
}

export function validateBloodPressure(systolic: number, diastolic: number): { systolic: number; diastolic: number } {
  return {
    systolic: Math.min(260, Math.max(40, Math.round(systolic))),
    diastolic: Math.min(180, Math.max(30, Math.round(diastolic))),
  };
}

export function validateHeartRate(bpm: number): number {
  return Math.min(240, Math.max(20, Math.round(bpm)));
}

export function validateSleepDuration(hours: number): number {
  return Math.min(24, Math.max(0, Number(hours) || 0));
}
