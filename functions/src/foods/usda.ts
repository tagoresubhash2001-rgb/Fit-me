import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { csvObjects } from './csv';
import { searchTokens } from './tokens';
import type { FoodDoc, FoodMicrosDoc } from './types';

const MACRO_IDS: Record<string, keyof FoodDoc['per100g']> = {
  '1008': 'calories',
  '1003': 'proteinG',
  '1005': 'carbsG',
  '1004': 'fatG',
  '1079': 'fiberG',
};
const MICRO_IDS: Record<string, keyof FoodMicrosDoc> = {
  '2000': 'sugarG',
  '1093': 'sodiumMg',
  '1087': 'calciumMg',
  '1089': 'ironMg',
  '1090': 'magnesiumMg',
  '1092': 'potassiumMg',
  '1095': 'zincMg',
  '1106': 'vitaminAUg',
  '1162': 'vitaminCMg',
  '1114': 'vitaminDUg',
  '1175': 'vitaminB6Mg',
  '1178': 'vitaminB12Ug',
};
// Categories outside the launch scope (infant formula, regional foods with no local relevance at launch).
const EXCLUDED_CATEGORIES = new Set(['Baby Foods', 'American Indian/Alaska Native Foods']);
const r = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

/** Heuristic for branded items (e.g. "PILLSBURY ...", "Pillsbury Golden Layer ..."): skipped for a generic database. */
export function looksBranded(description: string): boolean {
  if (/[®™]/.test(description)) return true;
  const first = description.split(/[ ,]/)[0];
  if (/^[A-Z][A-Z'&.-]{2,}$/.test(first)) return true;
  return /^(Pillsbury|Kraft|Kellogg|General Mills|Nabisco|Quaker|Campbell|Hormel|Oscar Mayer|Mars|Hershey|Nestle|Keebler|Heinz|Tyson|Kashi|Post|McDonald|Burger King|Wendy|Taco Bell|Subway|Pizza Hut|Domino|Papa John|KFC|Popeyes|Arby|Applebee|Denny|Olive Garden|Carrabba|Cracker Barrel|Restaurant|Fast foods)\b/i.test(
    description,
  );
}

export function portionLabel(p: Record<string, string>, units: Map<string, string>): string {
  const amount = Number(p.amount) || 1;
  const unit = units.get(p.measure_unit_id);
  const parts = [amount === 1 ? '1' : String(r(amount, 2))];
  if (unit && unit !== 'undetermined') parts.push(unit);
  if (p.modifier) parts.push(p.modifier);
  if (p.portion_description) parts.push(p.portion_description);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export interface UsdaFood {
  id: string;
  doc: FoodDoc;
  micros: FoodMicrosDoc;
}

/** Builds generic foods from the SR Legacy CSV folder. Keeps at most `max`, preferring foods with household portions. */
export function buildUsdaFoods(dir: string, max = Infinity): UsdaFood[] {
  const read = (f: string) => csvObjects(readFileSync(join(dir, f), 'utf8'));
  const categories = new Map(read('food_category.csv').map((c) => [c.id, c.description]));
  const units = new Map(read('measure_unit.csv').map((u) => [u.id, u.name]));
  const foods = read('food.csv');
  const nutrients = new Map<string, Record<string, number>>();
  for (const n of read('food_nutrient.csv')) {
    if (!MACRO_IDS[n.nutrient_id] && !MICRO_IDS[n.nutrient_id]) continue;
    const m = nutrients.get(n.fdc_id) ?? {};
    m[n.nutrient_id] = Number(n.amount);
    nutrients.set(n.fdc_id, m);
  }
  const portions = new Map<string, FoodDoc['servings']>();
  for (const p of read('food_portion.csv')) {
    const g = Number(p.gram_weight);
    if (!(g > 0)) continue;
    const list = portions.get(p.fdc_id) ?? [];
    if (list.length < 6) list.push({ label: portionLabel(p, units), grams: r(g, 1) });
    portions.set(p.fdc_id, list);
  }

  const out: UsdaFood[] = [];
  for (const f of foods) {
    const category = categories.get(f.food_category_id) ?? 'Other';
    if (EXCLUDED_CATEGORIES.has(category) || looksBranded(f.description)) continue;
    const n = nutrients.get(f.fdc_id);
    if (!n || n['1008'] === undefined) continue;
    const per100g = {
      calories: Math.round(n['1008'] ?? 0),
      proteinG: r(n['1003'] ?? 0),
      carbsG: r(n['1005'] ?? 0),
      fatG: r(n['1004'] ?? 0),
      fiberG: r(n['1079'] ?? 0),
    };
    const micros: FoodMicrosDoc = {};
    for (const [id, key] of Object.entries(MICRO_IDS)) if (n[id] !== undefined) micros[key] = r(n[id], 2);
    const servings = portions.get(f.fdc_id) ?? [];
    const name = f.description.trim();
    out.push({
      id: `usda-${f.fdc_id}`,
      doc: {
        name,
        per100g,
        servings,
        source: 'usda',
        sourceId: f.fdc_id,
        category,
        countries: [],
        searchTokens: searchTokens([name]),
        rank: (servings.length ? 50 : 0) - Math.min(40, name.length / 3),
        reviewStatus: 'approved',
        license: 'USDA FoodData Central (public domain, CC0)',
      },
      micros,
    });
  }
  return out.sort((a, b) => b.doc.rank - a.doc.rank).slice(0, max);
}
