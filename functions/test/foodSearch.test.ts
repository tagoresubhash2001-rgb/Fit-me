import { describe, expect, it } from 'vitest';
import { computeDish, dishFoods, ifctFoods, legacyCuratedFoods, parseIfct, type IngredientTable, type CatalogFood } from '../src/foods/catalog';
import { DISHES } from '../src/foods/dishes';
import { INGREDIENTS } from '../src/foods/ingredients';
import { editDistance, fold, FoodIndex } from '../src/foods/search';
import { tokensFor } from '../src/scripts/seed-foods';

// Every ingredient at 100 kcal / 100 g (rice-like macros) so recipe arithmetic is easy to check.
const table = Object.fromEntries(Object.keys(INGREDIENTS).map((k) => [k, { calories: 100, proteinG: 2, carbsG: 20, fatG: 1, fiberG: 1, sodiumMg: 10 }])) as unknown as IngredientTable;

const generic = (id: string, name: string, extra: Partial<CatalogFood> = {}): CatalogFood => ({
  id,
  name,
  aliases: [],
  category: 'Other',
  countries: [],
  source: 'usda',
  dataset: 'USDA FoodData Central, SR Legacy',
  sourceId: id,
  per100g: { calories: 100, proteinG: 1, carbsG: 1, fatG: 1, fiberG: 1 },
  micros: {},
  servings: [],
  rank: 50,
  reviewStatus: 'approved',
  license: 'CC0',
  ...extra,
});

const catalog = [
  ...legacyCuratedFoods(),
  ...dishFoods(table),
  generic('usda-1', 'Pasta, cooked, enriched, without added salt'),
  generic('usda-2', 'Apples, raw, with skin'),
  generic('usda-3', 'Chicken, broilers or fryers, breast, meat only, cooked, roasted'),
  generic('usda-4', 'Cereals, oats, regular and quick, not fortified, dry'),
  generic('usda-5', 'Cucumber, with peel, raw'),
  generic('ifct-D043', 'Cucumber, green, elongate', { source: 'ifct', countries: ['IN'], keywords: ['Dosakaya', 'Kheera'], rank: 60 }),
];
const index = new FoodIndex(catalog);
const names = (q: string, country = 'IN') => index.search(q, { country, limit: 10 }).items.map((f) => f.name);

describe('folding and distance', () => {
  it('meets transliteration variants', () => {
    expect(fold('idly')).toBe(fold('idli'));
    expect(fold('iddli')).toBe(fold('idli'));
    expect(fold('dosai')).toBe(fold('dosa'));
    expect(fold('dose')).toBe(fold('dosa'));
    expect(fold('wada')).toBe(fold('vada'));
    expect(fold('zeera')).toBe(fold('jeera'));
    expect(fold('apples')).toBe(fold('apple'));
  });
  it('edit distance with transpositions and early exit', () => {
    expect(editDistance('spagheti', 'spaghetti', 2)).toBe(1);
    expect(editDistance('chikcen', 'chicken', 2)).toBe(1);
    expect(editDistance('masla', 'masala', 1)).toBe(1);
    expect(editDistance('pizza', 'pasta', 1)).toBe(2);
  });
});

describe('food search (owner list, PRD 0.1)', () => {
  it('dosa returns every dosa variant, not three or four', () => {
    const r = index.search('dosa', { country: 'IN', limit: 100 });
    const all = r.items.map((f) => f.name);
    for (const n of ['Plain dosa', 'Masala dosa', 'Onion dosa', 'Rava dosa', 'Set dosa', 'Ghee roast dosa', 'Mysore masala dosa', 'Paper dosa', 'Ragi dosa', 'Pesarattu (green gram dosa)', 'Egg dosa', 'Upma pesarattu'])
      expect(all, n).toContain(n);
    expect(r.total).toBeGreaterThanOrEqual(25);
    expect(all[0]).toBe('Plain dosa');
    // The Telugu name of cucumber (dosakaya) must not push it above real dosas.
    expect(all.slice(0, 20)).not.toContain('Cucumber, green, elongate');
  });
  it.each([
    ['onion dosa', 'Onion dosa'],
    ['upma dosa', 'Upma pesarattu'],
    ['rava dosa', 'Rava dosa'],
    ['idli', 'Idli'],
    ['idly', 'Idli'],
    ['iddli', 'Idli'],
    ['vada', 'Medu vada'],
    ['pongal', 'Ven pongal'],
    ['penne alfredo', 'Penne alfredo'],
    ['pizza', 'Margherita pizza'],
    ['masla dosa', 'Masala dosa'],
    ['chiken biryani', 'Chicken dum biryani'],
    ['curd rice', 'Curd rice'],
  ])('%s -> %s first', (q, first) => {
    expect(names(q)[0]).toBe(first);
  });
  it.each([
    ['biryani', ['Chicken dum biryani', 'Mutton biryani', 'Vegetable biryani', 'Hyderabadi chicken biryani']],
    ['pasta', ['Pasta with tomato sauce', 'Penne alfredo', 'Penne arrabbiata', 'Pasta, cooked, enriched, without added salt']],
    ['oats', ['Oatmeal with milk', 'Cereals, oats, regular and quick, not fortified, dry']],
    ['apple', ['Apples, raw, with skin']],
    ['chicken breast', ['Chicken, broilers or fryers, breast, meat only, cooked, roasted']],
    ['spagheti', ['Spaghetti bolognese', 'Spaghetti carbonara']],
  ])('%s finds %j', (q, expected) => {
    const r = index.search(q, { country: 'IN', limit: 100 }).items.map((f) => f.name);
    for (const e of expected) expect(r).toContain(e);
  });
  it('pages instead of cutting results off', () => {
    const first = index.search('dosa', { limit: 5 });
    const second = index.search('dosa', { limit: 5, offset: 5 });
    expect(first.items).toHaveLength(5);
    expect(second.items).toHaveLength(5);
    expect(second.items[0].id).not.toBe(first.items[0].id);
    expect(first.total).toBe(second.total);
  });
  it('is case and accent insensitive', () => {
    expect(names('PÃO DE QUEIJO')[0]).toBe('Pão de queijo');
    expect(names('Onion DOSA')[0]).toBe('Onion dosa');
  });
  it('local names in native script are searchable', () => {
    expect(names('ఉల్లి దోశ')[0]).toBe('Onion dosa');
    expect(names('इडली')[0]).toBe('Idli');
  });
  it('the user country ranks first', () => {
    expect(index.search('cucumber', { country: 'IN' }).items[0].name).toBe('Cucumber, green, elongate');
    expect(index.search('cucumber', { country: 'US' }).items[0].name).toBe('Cucumber, with peel, raw');
  });
  it('empty or stop-word queries return nothing', () => {
    expect(index.search('  ').total).toBe(0);
    expect(index.search('with and').total).toBe(0);
  });
});

describe('catalogue building', () => {
  it('computes a dish from its recipe and cooked weight', () => {
    const dish = DISHES.find((d) => d.id === 'si-onion-dosa')!;
    const grams = Object.values(dish.recipe).reduce((a, b) => a + b, 0);
    const { perServing, per100 } = computeDish(dish, table);
    expect(perServing.calories).toBeCloseTo(grams, 6); // 100 kcal per 100 g of each ingredient
    expect(per100.calories).toBeCloseTo((grams * 100) / dish.grams, 6);
    expect(perServing.sodiumMg).toBeCloseTo(grams / 10, 6);
  });
  it('every dish has unique ids, aliases and positive weights', () => {
    const ids = new Set(DISHES.map((d) => d.id));
    expect(ids.size).toBe(DISHES.length);
    for (const d of DISHES) {
      expect(d.grams, d.id).toBeGreaterThan(0);
      expect(Object.keys(d.recipe).length, d.id).toBeGreaterThan(0);
    }
    expect(DISHES.length).toBeGreaterThanOrEqual(250);
  });
  it('converts IFCT units (g per 100 g, kJ) and keeps regional names as keywords', () => {
    const csv = [
      '"Food Code; code","Food Name; name","Local Name; lang","Food Group; grup","Energy; enerc","Total Fat; fatce","Dietary Fiber; fibtg","Carbohydrate; choavldf","Protein; protcnt","Sodium (Na); na","Calcium (Ca); ca","Vitamin A; vita"',
      '"L002","Milk, whole, Cow","H. Doodh; Tel. Palu.","Milk and Milk Products","305","4.48","0","4.94","3.26","0.02546","0.118","0.00001367"',
      '"T013","Ghee","H. Ghee","Edible Oils and Fats","0","100","0","0","0","0","0","0"',
      '"D010","Brinjal-1","","Other Vegetables","113","0.3","4","2","1","0","0","0"',
    ].join('\n');
    const rows = parseIfct(csv);
    expect(rows[0].per100).toMatchObject({ calories: 73, fatG: 4.5, sodiumMg: 25.46, calciumMg: 118, vitaminAUg: 13.67 });
    expect(rows[1].per100.calories).toBe(900);
    const foods = ifctFoods(rows);
    expect(foods.map((f) => f.id)).toEqual(['ifct-L002', 'ifct-T013']); // numbered cultivars skipped
    expect(foods[0].keywords).toEqual(['Doodh', 'Palu']);
  });
  it('offline tokens include folded prefixes and aliases', () => {
    const t = tokensFor({ name: 'Idli', aliases: ['idly'], names: { te: 'ఇడ్లీ' } });
    expect(t).toEqual(expect.arrayContaining(['id', 'idl', 'idli', 'idly']));
  });
});
