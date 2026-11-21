import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { csvObjects, parseCsv } from './csv';
import { CURATED_ALIASES, DISHES, type Dish, type Unit } from './dishes';
import { curatedFoods } from './curated';
import { INGREDIENTS, type Ingredient, type IngredientRef } from './ingredients';
import { looksBranded, portionLabel } from './usda';
import type { FoodMicrosDoc } from './types';

/**
 * One food in the FitMe catalogue, whatever its source. The seed script writes it to Firestore (`foods`,
 * `foodMicros`) and into the search index; the search function returns it to the app.
 */
export interface CatalogFood {
  id: string;
  name: string;
  names?: Record<string, string>;
  aliases: string[];
  /** Weaker search words, e.g. IFCT regional names in Latin script. */
  keywords?: string[];
  cuisine?: string;
  category: string;
  countries: string[];
  source: 'curated' | 'ifct' | 'usda' | 'off';
  /** Human-readable dataset, shown as the source of the values. */
  dataset: string;
  sourceId: string;
  brand?: string;
  per100g: { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number };
  micros: FoodMicrosDoc;
  servings: Array<{ label: string; labels?: Record<string, string>; grams: number }>;
  rank: number;
  reviewStatus: 'approved' | 'pending_review';
  license: string;
}

export type Per100 = CatalogFood['per100g'] & FoodMicrosDoc;
const r = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const MACROS = ['calories', 'proteinG', 'carbsG', 'fatG', 'fiberG'] as const;
const MICRO_KEYS: Array<keyof FoodMicrosDoc> = ['sugarG', 'sodiumMg', 'calciumMg', 'ironMg', 'magnesiumMg', 'potassiumMg', 'zincMg', 'vitaminAUg', 'vitaminCMg', 'vitaminDUg', 'vitaminB6Mg', 'vitaminB12Ug'];

// ---------------------------------------------------------------- IFCT 2017
/** IFCT stores every nutrient in g per 100 g (energy in kJ); convert to the app's units. */
const IFCT_MICROS: Array<[string, keyof FoodMicrosDoc, number]> = [
  ['fsugar', 'sugarG', 1],
  ['na', 'sodiumMg', 1000],
  ['ca', 'calciumMg', 1000],
  ['fe', 'ironMg', 1000],
  ['mg', 'magnesiumMg', 1000],
  ['k', 'potassiumMg', 1000],
  ['zn', 'zincMg', 1000],
  ['vita', 'vitaminAUg', 1e6],
  ['vitc', 'vitaminCMg', 1000],
  ['vitd', 'vitaminDUg', 1e6],
  ['vitb6c', 'vitaminB6Mg', 1000],
];

export interface IfctRow {
  code: string;
  name: string;
  group: string;
  localNames: string[];
  per100: Per100;
}

export function parseIfct(csvText: string): IfctRow[] {
  const [header, ...rows] = parseCsv(csvText);
  const idx = Object.fromEntries(header.map((h, i) => [h.split('; ')[1], i]));
  const num = (row: string[], key: string) => Number(row[idx[key]] || 0) || 0;
  return rows.map((row) => {
    const fat = num(row, 'fatce');
    const kj = num(row, 'enerc');
    const per100: Per100 = {
      // Oils and ghee have no energy value in IFCT: use the Atwater factor for pure fat.
      calories: Math.round(kj > 0 ? kj / 4.184 : fat * 9),
      proteinG: r(num(row, 'protcnt')),
      carbsG: r(num(row, 'choavldf')),
      fatG: r(fat),
      fiberG: r(num(row, 'fibtg')),
    };
    for (const [key, out, f] of IFCT_MICROS) if (row[idx[key]]) per100[out] = r(num(row, key) * f, 2);
    const localNames = String(row[idx.lang] ?? '')
      .split(';')
      .map((s) => s.trim().replace(/\.$/, ''))
      .filter(Boolean);
    return { code: row[idx.code], name: row[idx.name], group: row[idx.grup], localNames, per100 };
  });
}

/** Local names "H. Ramdana; Tel. Thotakoora ginjalu" -> aliases (Latin script) keyed by language. */
function ifctAliases(local: string[]): string[] {
  const out = new Set<string>();
  for (const entry of local) {
    const m = entry.match(/^((?:[A-Z][a-z]*\.,?\s*)+)(.+)$/);
    const name = (m ? m[2] : entry).trim();
    if (name && name.length < 40) out.add(name);
  }
  return [...out];
}

export function ifctFoods(rows: IfctRow[]): CatalogFood[] {
  return rows
    // Numbered cultivars ("Brinjal-7", "Chillies, green-3") duplicate the "all varieties" row.
    .filter((x) => !/-\d+$/.test(x.name))
    .map((x) => {
      const { calories, proteinG, carbsG, fatG, fiberG, ...micros } = x.per100;
      return {
        id: `ifct-${x.code}`,
        name: x.name.replace(/-\s*all varieties$/i, '').replace(/\s+/g, ' ').trim(),
        aliases: [],
        keywords: ifctAliases(x.localNames),
        cuisine: 'Indian',
        category: x.group,
        countries: ['IN'],
        source: 'ifct' as const,
        dataset: 'Indian Food Composition Tables 2017 (NIN)',
        sourceId: x.code,
        per100g: { calories, proteinG, carbsG, fatG, fiberG },
        micros,
        servings: [],
        rank: 60,
        reviewStatus: 'approved' as const,
        license: 'Indian Food Composition Tables 2017, National Institute of Nutrition (ICMR), Hyderabad',
      };
    });
}

// ---------------------------------------------------------------- USDA FoodData Central
const USDA_IDS: Record<string, keyof Per100> = {
  '1008': 'calories',
  '1003': 'proteinG',
  '1005': 'carbsG',
  '1004': 'fatG',
  '1079': 'fiberG',
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
// Foundation foods report energy as Atwater general/specific factors instead of 1008.
const ENERGY_FALLBACK = ['2047', '2048'];

function usdaNutrients(dir: string): Map<string, Per100> {
  const out = new Map<string, Per100>();
  const fallback = new Map<string, number>();
  // FNDDS files put the legacy nutrient number (208 = energy) in nutrient_id; map it back to the id.
  const byNumber = new Map<string, string>();
  if (existsSync(join(dir, 'nutrient.csv')))
    for (const x of csvObjects(readFileSync(join(dir, 'nutrient.csv'), 'utf8'))) if (x.nutrient_nbr) byNumber.set(String(Math.round(Number(x.nutrient_nbr))), x.id);
  for (const n of csvObjects(readFileSync(join(dir, 'food_nutrient.csv'), 'utf8'))) {
    const nid = USDA_IDS[n.nutrient_id] || ENERGY_FALLBACK.includes(n.nutrient_id) ? n.nutrient_id : (byNumber.get(n.nutrient_id) ?? n.nutrient_id);
    const key = USDA_IDS[nid];
    if (ENERGY_FALLBACK.includes(nid)) fallback.set(n.fdc_id, Number(n.amount));
    if (!key) continue;
    const m = out.get(n.fdc_id) ?? ({ calories: NaN, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 } as Per100);
    (m as unknown as Record<string, number>)[key] = Number(n.amount);
    out.set(n.fdc_id, m);
  }
  for (const [id, m] of out) if (Number.isNaN(m.calories) && fallback.has(id)) m.calories = fallback.get(id)!;
  return out;
}

function splitPer100(n: Per100): Pick<CatalogFood, 'per100g' | 'micros'> {
  const per100g = { calories: Math.round(n.calories), proteinG: r(n.proteinG), carbsG: r(n.carbsG), fatG: r(n.fatG), fiberG: r(n.fiberG) };
  const micros: FoodMicrosDoc = {};
  for (const k of MICRO_KEYS) if (n[k] !== undefined && !Number.isNaN(n[k])) micros[k] = r(n[k]!, 2);
  return { per100g, micros };
}

/** USDA rows by exact description, for the recipe ingredients (SR Legacy). */
export function usdaByDescription(dir: string): Map<string, Per100> {
  const nutrients = usdaNutrients(dir);
  const out = new Map<string, Per100>();
  for (const f of csvObjects(readFileSync(join(dir, 'food.csv'), 'utf8'))) {
    const n = nutrients.get(f.fdc_id);
    if (n && !Number.isNaN(n.calories)) out.set(f.description, n);
  }
  return out;
}

const SKIP_PORTION = /quantity not specified|^\s*$/i;

/** FNDDS (survey foods: mixed dishes as eaten, e.g. "Dosa, plain", "Pasta with cream sauce"). */
export function fnddsFoods(dir: string): CatalogFood[] {
  const read = (f: string) => csvObjects(readFileSync(join(dir, f), 'utf8'));
  const categories = new Map(read('wweia_food_category.csv').map((c) => [c.wweia_food_category, c.wweia_food_category_description]));
  const nutrients = usdaNutrients(dir);
  const portions = new Map<string, CatalogFood['servings']>();
  for (const p of read('food_portion.csv')) {
    const g = Number(p.gram_weight);
    if (!(g > 0) || SKIP_PORTION.test(p.portion_description)) continue;
    const list = portions.get(p.fdc_id) ?? [];
    if (list.length < 6) list.push({ label: p.portion_description.trim(), grams: r(g) });
    portions.set(p.fdc_id, list);
  }
  const out: CatalogFood[] = [];
  for (const f of read('food.csv')) {
    const n = nutrients.get(f.fdc_id);
    if (!n || Number.isNaN(n.calories)) continue;
    const category = categories.get(f.food_category_id) ?? 'Other';
    if (/baby|infant|formula|human milk/i.test(`${category} ${f.description}`)) continue;
    out.push({
      id: `fndds-${f.fdc_id}`,
      name: f.description.trim(),
      aliases: [],
      category,
      countries: [],
      source: 'usda',
      dataset: 'USDA FoodData Central, FNDDS (foods as eaten)',
      sourceId: f.fdc_id,
      ...splitPer100(n),
      servings: portions.get(f.fdc_id) ?? [],
      rank: 55,
      reviewStatus: 'approved',
      license: 'USDA FoodData Central (public domain, CC0)',
    });
  }
  return out;
}

/** Foundation foods (analytical values for basic ingredients). */
export function foundationFoods(dir: string): CatalogFood[] {
  const read = (f: string) => csvObjects(readFileSync(join(dir, f), 'utf8'));
  const categories = new Map(read('food_category.csv').map((c) => [c.id, c.description]));
  const units = new Map(read('measure_unit.csv').map((u) => [u.id, u.name]));
  const nutrients = usdaNutrients(dir);
  const portions = new Map<string, CatalogFood['servings']>();
  for (const p of read('food_portion.csv')) {
    const g = Number(p.gram_weight);
    if (!(g > 0)) continue;
    const list = portions.get(p.fdc_id) ?? [];
    if (list.length < 6) list.push({ label: portionLabel(p, units), grams: r(g) });
    portions.set(p.fdc_id, list);
  }
  const out: CatalogFood[] = [];
  for (const f of read('food.csv')) {
    if (f.data_type !== 'foundation_food') continue;
    const n = nutrients.get(f.fdc_id);
    if (!n || Number.isNaN(n.calories) || looksBranded(f.description)) continue;
    out.push({
      id: `usdaf-${f.fdc_id}`,
      name: f.description.trim(),
      aliases: [],
      category: categories.get(f.food_category_id) ?? 'Other',
      countries: [],
      source: 'usda',
      dataset: 'USDA FoodData Central, Foundation Foods',
      sourceId: f.fdc_id,
      ...splitPer100(n),
      servings: portions.get(f.fdc_id) ?? [],
      rank: 50,
      reviewStatus: 'approved',
      license: 'USDA FoodData Central (public domain, CC0)',
    });
  }
  return out;
}

// ---------------------------------------------------------------- Recipe dishes
export type IngredientTable = Record<Ingredient, Per100>;

export function resolveIngredients(ifct: IfctRow[], usda: Map<string, Per100>): IngredientTable {
  const byCode = new Map(ifct.map((x) => [x.code, x.per100]));
  const out = {} as IngredientTable;
  for (const [key, ref] of Object.entries(INGREDIENTS) as Array<[Ingredient, IngredientRef]>) {
    let v: Per100 | undefined;
    if ('fat' in ref) v = { calories: 900, proteinG: 0, carbsG: 0, fatG: 100, fiberG: 0 };
    else if ('ifct' in ref) v = byCode.get(ref.ifct);
    else v = usda.get(ref.usda);
    if (!v) throw new Error(`ingredient ${key} not found in its source (${JSON.stringify(ref)})`);
    out[key] = v;
  }
  return out;
}

const UNIT_LABELS: Record<Unit, { en: string; te?: string; hi?: string; ta?: string }> = {
  piece: { en: '1 piece', te: '1 ముక్క', hi: '1 पीस', ta: '1 துண்டு' },
  plate: { en: '1 plate', te: '1 ప్లేట్', hi: '1 प्लेट', ta: '1 தட்டு' },
  bowl: { en: '1 bowl', te: '1 గిన్నె', hi: '1 कटोरा', ta: '1 கிண்ணம்' },
  katori: { en: '1 katori (small bowl)', te: '1 చిన్న గిన్నె', hi: '1 कटोरी', ta: '1 சிறிய கிண்ணம்' },
  cup: { en: '1 cup', te: '1 కప్పు', hi: '1 कप', ta: '1 கப்' },
  glass: { en: '1 glass', te: '1 గ్లాసు', hi: '1 गिलास', ta: '1 கிளாஸ்' },
  slice: { en: '1 slice', te: '1 స్లైస్', hi: '1 स्लाइस', ta: '1 துண்டு' },
  serving: { en: '1 serving', te: '1 సర్వింగ్', hi: '1 सर्विंग', ta: '1 பரிமாறல்' },
  roll: { en: '1 roll', te: '1 రోల్', hi: '1 रोल', ta: '1 ரோல்' },
};

/** Nutrition of one serving and per 100 g, summed from the recipe's raw ingredients. */
export function computeDish(dish: Dish, table: IngredientTable): { perServing: Per100; per100: Per100 } {
  const perServing: Per100 = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  for (const [ing, grams] of Object.entries(dish.recipe) as Array<[Ingredient, number]>) {
    const v = table[ing];
    if (!v) throw new Error(`${dish.id}: unknown ingredient ${ing}`);
    for (const k of [...MACROS, ...MICRO_KEYS]) {
      const x = v[k];
      if (x === undefined || Number.isNaN(x)) continue;
      perServing[k] = (perServing[k] ?? 0) + (x * grams) / 100;
    }
  }
  const per100 = Object.fromEntries(Object.entries(perServing).map(([k, x]) => [k, (x * 100) / dish.grams])) as unknown as Per100;
  return { perServing, per100 };
}

export function dishFoods(table: IngredientTable): CatalogFood[] {
  return DISHES.map((dish) => {
    const { per100 } = computeDish(dish, table);
    const u = UNIT_LABELS[dish.unit];
    const labels = Object.fromEntries(Object.entries(u).filter(([k]) => k !== 'en')) as Record<string, string>;
    return {
      id: `dish-${dish.id}`,
      name: dish.name,
      ...(dish.names ? { names: dish.names as Record<string, string> } : {}),
      aliases: dish.aliases,
      cuisine: dish.cuisine,
      category: dish.category,
      countries: dish.countries,
      source: 'curated' as const,
      dataset: 'FitMe standard recipe, computed from IFCT 2017 and USDA FoodData Central',
      sourceId: dish.id,
      ...splitPer100(per100),
      servings: [{ label: u.en, labels, grams: dish.grams }],
      rank: 90,
      reviewStatus: 'pending_review' as const,
      license: 'FitMe curated recipe (Sindulis Innovative Solutions); ingredient values IFCT 2017 / USDA FoodData Central',
    };
  });
}

// ---------------------------------------------------------------- Open Food Facts
/** A product from the Open Food Facts API (fields requested by scripts/fetch-off.ts). */
export interface OffProduct {
  code: string;
  product_name?: string;
  brands?: string;
  countries_tags?: string[];
  categories_tags?: string[];
  serving_size?: string;
  serving_quantity?: number | string;
  unique_scans_n?: number;
  nutriments?: Record<string, number | string>;
}

const OFF_COUNTRY: Record<string, string> = {
  'en:india': 'IN',
  'en:united-states': 'US',
  'en:united-kingdom': 'GB',
  'en:france': 'FR',
  'en:germany': 'DE',
  'en:spain': 'ES',
  'en:brazil': 'BR',
  'en:portugal': 'PT',
  'en:indonesia': 'ID',
  'en:united-arab-emirates': 'AE',
  'en:saudi-arabia': 'SA',
  'en:mexico': 'MX',
};

export function offFoods(products: OffProduct[]): CatalogFood[] {
  const out = new Map<string, CatalogFood>();
  for (const p of products) {
    const n = p.nutriments ?? {};
    const kcal = Number(n['energy-kcal_100g'] ?? (n['energy_100g'] !== undefined ? Number(n['energy_100g']) / 4.184 : NaN));
    const name = (p.product_name ?? '').trim();
    if (!p.code || !name || !(kcal >= 0) || kcal > 900) continue;
    const g = (k: string) => (n[k] === undefined || n[k] === '' ? undefined : Number(n[k]));
    if (g('proteins_100g') === undefined || g('carbohydrates_100g') === undefined || g('fat_100g') === undefined) continue;
    const brand = (p.brands ?? '').split(',')[0].trim();
    const micros: FoodMicrosDoc = {};
    const set = (k: keyof FoodMicrosDoc, v: number | undefined, f = 1) => v !== undefined && !Number.isNaN(v) && (micros[k] = r(v * f, 2));
    set('sugarG', g('sugars_100g'));
    set('sodiumMg', g('sodium_100g'), 1000);
    set('calciumMg', g('calcium_100g'), 1000);
    set('ironMg', g('iron_100g'), 1000);
    set('potassiumMg', g('potassium_100g'), 1000);
    set('vitaminCMg', g('vitamin-c_100g'), 1000);
    const sq = Number(p.serving_quantity);
    out.set(p.code, {
      id: `off-${p.code}`,
      name: brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${name} (${brand})` : name,
      aliases: brand ? [brand] : [],
      category: (p.categories_tags ?? []).find((c) => c.startsWith('en:'))?.slice(3).replace(/-/g, ' ') ?? 'Packaged food',
      countries: [...new Set((p.countries_tags ?? []).map((c) => OFF_COUNTRY[c]).filter(Boolean))],
      source: 'off',
      dataset: 'Open Food Facts',
      sourceId: p.code,
      ...(brand ? { brand } : {}),
      per100g: { calories: Math.round(kcal), proteinG: r(g('proteins_100g')!), carbsG: r(g('carbohydrates_100g')!), fatG: r(g('fat_100g')!), fiberG: r(g('fiber_100g') ?? 0) },
      micros,
      servings: sq > 0 && sq < 2000 ? [{ label: p.serving_size?.trim() || `1 serving (${sq} g)`, grams: r(sq) }] : [],
      rank: 40 + Math.min(20, Math.log10(1 + (p.unique_scans_n ?? 0)) * 5),
      reviewStatus: 'approved',
      license: 'Open Food Facts (ODbL 1.0), openfoodfacts.org',
    });
  }
  return [...out.values()];
}

/** The original curated dishes (curated.ts, ids cur-*), with their aliases. Values are kept as they are. */
export function legacyCuratedFoods(): CatalogFood[] {
  return curatedFoods().map(({ id, doc }) => ({
    id,
    name: doc.name,
    ...(doc.names && Object.keys(doc.names).length ? { names: doc.names } : {}),
    aliases: CURATED_ALIASES[doc.sourceId] ?? [],
    category: doc.category,
    countries: doc.countries,
    source: 'curated' as const,
    dataset: 'FitMe curated dish',
    sourceId: doc.sourceId,
    per100g: doc.per100g,
    micros: {},
    servings: doc.servings,
    rank: 88,
    reviewStatus: doc.reviewStatus,
    license: 'FitMe curated dish (Sindulis Innovative Solutions)',
  }));
}
