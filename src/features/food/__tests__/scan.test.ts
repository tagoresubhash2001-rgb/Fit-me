import { describe, expect, it } from 'vitest';
import { rowNutrients } from '../ScanFood';

const range = (min: number, max: number) => ({ min, max });
const item = {
  name: 'Masala dosa',
  portion: '1 piece',
  grams: range(150, 210),
  calories: range(250, 330),
  proteinG: range(5, 8),
  carbsG: range(35, 45),
  fatG: range(9, 13),
  fiberG: range(2, 4),
  confidence: 'medium' as const,
};

describe('photo scan nutrition', () => {
  it('uses database values for a matched food, scaled to the corrected grams', () => {
    const n = rowNutrients({ item: { ...item, match: { id: 'cur-in-masala-dosa', name: 'Masala dosa', source: 'curated', per100g: { calories: 150, proteinG: 3.5, carbsG: 22, fatG: 5.5, fiberG: 1.8 }, servings: [] } }, grams: 200 });
    expect(n).toMatchObject({ calories: 300, proteinG: 7, carbsG: 44, fatG: 11 });
  });
  it('without a match, scales the AI midpoint to the grams (labelled as an estimate in the UI)', () => {
    const n = rowNutrients({ item: { ...item, match: null }, grams: 90 });
    expect(n.calories).toBe(Math.round(290 * (90 / 180)));
  });
});
