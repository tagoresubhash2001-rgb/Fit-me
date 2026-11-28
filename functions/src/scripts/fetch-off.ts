/**
 * Downloads the most-scanned packaged foods per country from Open Food Facts (ODbL) once, for the catalogue.
 * Respects the public API limit (10 search requests per minute). Output: one product per line (JSON).
 *   node lib/scripts/fetch-off.js --out off.jsonl [--pages 4]
 */
import { appendFileSync, writeFileSync } from 'node:fs';

const COUNTRIES = ['india', 'united-states', 'united-kingdom', 'france', 'germany', 'spain', 'brazil', 'indonesia', 'united-arab-emirates', 'mexico', 'portugal', 'saudi-arabia'];
const FIELDS = 'code,product_name,brands,countries_tags,categories_tags,serving_size,serving_quantity,unique_scans_n,nutriments,image_front_small_url';
const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const out = arg('out') ?? 'off.jsonl';
  const pages = Number(arg('pages') ?? 4);
  writeFileSync(out, '');
  let total = 0;
  for (const country of COUNTRIES) {
    for (let page = 1; page <= pages; page++) {
      const url = `https://world.openfoodfacts.org/api/v2/search?countries_tags_en=${country}&sort_by=unique_scans_n&page_size=100&page=${page}&fields=${FIELDS}`;
      let ok = false;
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'FoodCatalogImport/1.0' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const body = (await res.json()) as { products?: unknown[] };
          for (const p of body.products ?? []) appendFileSync(out, `${JSON.stringify(p)}\n`);
          total += body.products?.length ?? 0;
          console.log(`${country} page ${page}: ${body.products?.length ?? 0} (total ${total})`);
          ok = true;
        } catch (e) {
          console.warn(`${country} page ${page} attempt ${attempt + 1} failed: ${(e as Error).message}`);
          await sleep(15000);
        }
      }
      await sleep(7000);
    }
  }
}

void main();
