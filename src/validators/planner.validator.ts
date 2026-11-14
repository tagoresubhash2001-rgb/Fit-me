/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function validatePlannerEventTime(timeStr: string): boolean {
  const regex = /^(0[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/;
  return regex.test(timeStr);
}

export function validatePlannerLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "Unnamed Custom Focus Activity";
  return trimmed.slice(0, 80);
}
