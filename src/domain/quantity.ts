import type { Nutrients } from './models';
import { scaleNutrients, type FoodItem } from './nutrition';

/**
 * Quantity units for food logging (owner correction 8). The food's own servings come first
 * (exact grams from the database); generic household units use standard approximate weights.
 */
export const GENERIC_UNITS = ['g', 'ml', 'serving', 'piece', 'katori', 'cup', 'tbsp', 'tsp', 'slice'] as const;
export type GenericUnit = (typeof GENERIC_UNITS)[number];

/** Approximate grams per generic unit (ml assumes a water-like density). */
export const GENERIC_GRAMS: Record<Exclude<GenericUnit, 'serving' | 'piece'>, number> = {
  g: 1,
  ml: 1,
  katori: 150,
  cup: 240,
  tbsp: 15,
  tsp: 5,
  slice: 30,
};

export interface UnitOption {
  id: string;
  label: string;
  grams: number;
  approximate: boolean;
}

export const MULTIPLIERS = [0.5, 1, 1.5, 2] as const;

/** All unit options for a food: its own servings, then generic units not already covered. */
export function unitOptionsFor(food: Pick<FoodItem, 'servings'>, labels: Record<GenericUnit, string>, language = 'en'): UnitOption[] {
  const own: UnitOption[] = food.servings.map((s, i) => ({ id: `own-${i}`, label: s.labels?.[language] ?? s.label, grams: s.grams, approximate: false }));
  const first = food.servings[0]?.grams;
  const piece = food.servings.find((s) => /piece|ముక్క|पीस|துண்டு/i.test(s.label))?.grams ?? first;
  const generic: UnitOption[] = GENERIC_UNITS.flatMap((u): UnitOption[] => {
    if (u === 'serving') return first ? [{ id: u, label: labels[u], grams: first, approximate: false }] : [{ id: u, label: labels[u], grams: 100, approximate: true }];
    if (u === 'piece') return piece ? [{ id: u, label: labels[u], grams: piece, approximate: false }] : [];
    return [{ id: u, label: labels[u], grams: GENERIC_GRAMS[u], approximate: u !== 'g' }];
  });
  return [...own, ...generic];
}

export function gramsFor(quantity: number, option: Pick<UnitOption, 'grams'>): number {
  return Math.max(0, quantity) * option.grams;
}

export function nutrientsFor(per100g: Nutrients, quantity: number, option: Pick<UnitOption, 'grams'>): Nutrients {
  return scaleNutrients(per100g, gramsFor(quantity, option));
}

/** Step size for the quantity stepper: grams/ml move in 10s, everything else in halves. */
export const stepFor = (unitId: string) => (unitId === 'g' || unitId === 'ml' ? 10 : 0.5);

export function clampQuantity(q: number, unitId: string): number {
  const max = unitId === 'g' || unitId === 'ml' ? 5000 : 50;
  const min = stepFor(unitId);
  return Math.min(max, Math.max(min, Math.round(q / min) * min));
}
