import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { parseCsv } from '../src/foods/csv';
import { buildUsdaFoods, looksBranded } from '../src/foods/usda';
import { curatedFoods } from '../src/foods/curated';
import { exerciseLibrary } from '../src/exercises/library';
import { searchTokens } from '../src/foods/tokens';

describe('csv', () => {
  it('handles quotes, commas and escaped quotes', () => {
    expect(parseCsv('"a","b, c","d ""e"""\r\n"1","2","3"\n')).toEqual([['a', 'b, c', 'd "e"'], ['1', '2', '3']]);
  });
});

describe('USDA import', () => {
  const foods = buildUsdaFoods(join(__dirname, 'fixtures/usda'));
  it('keeps generic foods with source, servings and per-100 g macros; skips branded and baby foods', () => {
    expect(foods.map((f) => f.id).sort()).toEqual(['usda-1', 'usda-4']);
    const rice = foods.find((f) => f.id === 'usda-1')!;
    expect(rice.doc.source).toBe('usda');
    expect(rice.doc.per100g).toEqual({ calories: 130, proteinG: 2.7, carbsG: 28.2, fatG: 0.3, fiberG: 0.4 });
    expect(rice.doc.servings).toEqual([{ label: '1 cup', grams: 158 }]);
    expect(rice.micros).toEqual({ sodiumMg: 1 });
    expect(rice.doc.searchTokens).toContain('rice');
    expect(rice.doc).not.toHaveProperty('per100g.sodiumMg');
  });
  it('detects branded descriptions', () => {
    expect(looksBranded('KRAFT Cheese')).toBe(true);
    expect(looksBranded('Pillsbury Cinnamon Rolls')).toBe(true);
    expect(looksBranded('Apples, raw, with skin')).toBe(false);
  });
});

describe('curated dishes', () => {
  const dishes = curatedFoods();
  it('every dish has a source, a pending review status and local servings', () => {
    for (const d of dishes) {
      expect(d.doc.source).toBe('curated');
      expect(d.doc.reviewStatus).toBe('pending_review');
      expect(d.doc.servings.length).toBeGreaterThan(0);
      expect(d.doc.countries.length).toBeGreaterThan(0);
    }
    expect(dishes.filter((d) => d.doc.countries.includes('IN')).length).toBeGreaterThanOrEqual(35);
  });
  it('energy is consistent with macros (4/4/9, within 20%)', () => {
    for (const d of dishes) {
      const { calories, proteinG, carbsG, fatG } = d.doc.per100g;
      const est = 4 * proteinG + 4 * carbsG + 9 * fatG;
      expect(Math.abs(est - calories) / calories, d.id).toBeLessThan(0.2);
    }
  });
  it('local-language names are searchable', () => {
    const idli = dishes.find((d) => d.id === 'cur-in-idli')!;
    expect(idli.doc.searchTokens).toEqual(expect.arrayContaining(searchTokens(['ఇడ్లీ'])));
  });
});

describe('exercise library', () => {
  it('has about 100 unique exercises with instructions', () => {
    const lib = exerciseLibrary();
    expect(lib.length).toBeGreaterThanOrEqual(100);
    expect(new Set(lib.map((e) => e.id)).size).toBe(lib.length);
    for (const e of lib) expect(e.doc.instructions.length).toBeGreaterThan(20);
  });
});
