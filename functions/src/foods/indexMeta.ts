import type { SearchFood } from './search';

/** Where the seed script stores the search index (gzipped JSON array of IndexFood) and its metadata doc. */
export const INDEX_PATH = 'catalog/foods-index.json.gz';
export const INDEX_META = 'appConfig/foodIndex';

/** An index entry: what search returns, plus micronutrients that only Premium and above receive. */
export interface IndexFood extends SearchFood {
  micros?: Record<string, number>;
}
