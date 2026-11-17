// Builds src/data/regions.json from the MIT-licensed country-region-data package (ISO 3166-2 subdivisions).
// Run: node scripts/build-regions.mjs
import * as data from 'country-region-data';
import { writeFileSync } from 'node:fs';

const out = { _source: 'country-region-data (MIT), https://github.com/country-regions/country-region-data' };
for (const [code, entry] of Object.entries(data)) {
  if (!/^[A-Z]{2}$/.test(code) || !Array.isArray(entry)) continue;
  const regions = entry[2];
  if (Array.isArray(regions) && regions.length) out[code] = regions.map(([name, short]) => [name, short ?? name]);
}
writeFileSync('src/data/regions.json', JSON.stringify(out));
console.log('countries with regions:', Object.keys(out).length - 1);
