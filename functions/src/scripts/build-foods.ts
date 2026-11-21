/**
 * Builds the FitMe food catalogue from public datasets (downloaded once, not called per search):
 *   --ifct <index.csv>       IFCT 2017 compositions (npm @ifct2017/compositions, data by NIN Hyderabad)
 *   --sr <dir>               USDA FoodData Central SR Legacy CSV folder
 *   --fndds <dir>            USDA FoodData Central survey (FNDDS) CSV folder
 *   --foundation <dir>       USDA FoodData Central Foundation Foods CSV folder
 *   --off <file.jsonl>       Open Food Facts products (scripts/fetch-off.ts), optional
 *   --out <file.json>        catalogue written here (input for scripts/seed-foods.ts)
 *   --review                 print the computed recipe dishes (kcal and macros per serving) for checking
 * Example:
 *   node lib/scripts/build-foods.js --ifct data/ifct.csv --sr sr --fndds fndds --foundation fdn --off off.jsonl --out catalog.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { DISHES } from '../foods/dishes';
import { buildUsdaFoods } from '../foods/usda';
import {
  computeDish,
  dishFoods,
  fnddsFoods,
  foundationFoods,
  ifctFoods,
  legacyCuratedFoods,
  offFoods,
  parseIfct,
  resolveIngredients,
  usdaByDescription,
  type CatalogFood,
  type OffProduct,
} from '../foods/catalog';

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const need = (name: string) => {
  const v = arg(name);
  if (!v) throw new Error(`--${name} is required`);
  return v;
};

function main() {
  const ifct = parseIfct(readFileSync(need('ifct'), 'utf8'));
  const srDir = need('sr');
  const table = resolveIngredients(ifct, usdaByDescription(srDir));

  if (process.argv.includes('--review')) {
    for (const d of DISHES) {
      const { perServing: s } = computeDish(d, table);
      console.log(
        [d.name.padEnd(42), `${d.unit} ${d.grams} g`.padEnd(16), `${Math.round(s.calories)} kcal`.padEnd(10), `P ${s.proteinG.toFixed(1)}`, `C ${s.carbsG.toFixed(1)}`, `F ${s.fatG.toFixed(1)}`, `Fib ${s.fiberG.toFixed(1)}`].join('  '),
      );
    }
  }

  const sr: CatalogFood[] = buildUsdaFoods(srDir, Infinity).map(({ id, doc, micros }) => ({
    id,
    name: doc.name,
    aliases: [],
    category: doc.category,
    countries: doc.countries,
    source: 'usda',
    dataset: 'USDA FoodData Central, SR Legacy',
    sourceId: doc.sourceId,
    per100g: doc.per100g,
    micros,
    servings: doc.servings,
    rank: doc.rank,
    reviewStatus: 'approved',
    license: doc.license,
  }));
  const off = arg('off')
    ? offFoods(
        readFileSync(arg('off')!, 'utf8')
          .split('\n')
          .filter(Boolean)
          .map((l) => JSON.parse(l) as OffProduct),
      )
    : [];
  const all = [...legacyCuratedFoods(), ...dishFoods(table), ...ifctFoods(ifct), ...fnddsFoods(need('fndds')), ...foundationFoods(need('foundation')), ...sr, ...off];
  const ids = new Set<string>();
  for (const f of all) {
    if (ids.has(f.id)) throw new Error(`duplicate id ${f.id}`);
    ids.add(f.id);
  }
  const count = (s: string) => all.filter((f) => f.dataset.startsWith(s) || f.dataset.includes(`, ${s}`)).length;
  console.log(
    `catalogue: ${all.length} foods (recipes ${count('FitMe')}, IFCT ${count('IFCT')}, FNDDS ${count('FNDDS')}, Foundation ${count('Foundation')}, SR Legacy ${count('SR Legacy')}, Open Food Facts ${count('Open Food Facts')})`,
  );
  const out = arg('out');
  if (out) writeFileSync(out, JSON.stringify(all));
}

main();
