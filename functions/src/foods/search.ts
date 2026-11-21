/**
 * Food search engine (server side). Case- and accent-insensitive, alias-aware, tolerant of transliteration
 * variants (idly/idli, dosai/dosa, vadai/wada), plurals, synonyms (penne -> pasta) and typos (Damerau-
 * Levenshtein), with partial-word matching anywhere in the name. Results are ranked and paged; nothing
 * is cut off silently. Pure and synchronous so it is unit-tested without Firebase.
 */

export interface SearchFood {
  id: string;
  name: string;
  names?: Record<string, string>;
  aliases?: string[];
  /** Weaker search words (e.g. regional names from IFCT): matched, but without phrase bonuses. */
  keywords?: string[];
  brand?: string;
  category?: string;
  cuisine?: string;
  countries?: string[];
  source: string;
  dataset?: string;
  rank?: number;
  per100g: { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number };
  servings: Array<{ label: string; labels?: Record<string, string>; grams: number }>;
  reviewStatus?: string;
}

export interface SearchOptions {
  country?: string;
  language?: string;
  offset?: number;
  limit?: number;
}

export interface SearchResult {
  items: SearchFood[];
  total: number;
  /** True when no food matched every word and the results match all but one. */
  partial: boolean;
}

const STOP = new Set(['with', 'and', 'of', 'the', 'in', 'a', 'an', 'or', 'on', 'without', 'de', 'la', 'le', 'e', 'y', 'con', 'com', 'mit', 'und']);

export function normalize(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/\p{M}+/gu, (m) => (/[ऀ-෿؀-ۿ]/.test(m) ? m : ''))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function words(s: string): string[] {
  return normalize(s)
    .split(' ')
    .filter((w) => w && !STOP.has(w));
}

/**
 * Phonetic folding for Latin-script words, applied to both the index and the query, so spelling variants of
 * transliterated dishes meet: idly -> idli, dosai/dose -> dosa, vadai/wada -> vada, iddli -> idli, zeera -> jeera.
 */
export function fold(w: string): string {
  if (!/^[a-z0-9]+$/.test(w)) return w;
  let s = w;
  if (s.length >= 4 && s.endsWith('s') && !s.endsWith('ss')) s = s.slice(0, -1);
  s = s
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/aa/g, 'a')
    .replace(/ph/g, 'f')
    .replace(/([bdgkst])h/g, '$1')
    .replace(/ck/g, 'k')
    .replace(/q/g, 'k')
    .replace(/w/g, 'v')
    .replace(/z/g, 'j')
    .replace(/(.)\1+/g, '$1');
  if (s.length >= 4) s = s.replace(/ai$/, 'a').replace(/y$/, 'i').replace(/e$/, 'a');
  return s;
}

/** Groups of words that mean the same food (folded forms are compared). */
const SYNONYMS: string[][] = [
  ['pasta', 'penne', 'spaghetti', 'fusilli', 'macaroni', 'linguine', 'fettuccine', 'rigatoni', 'farfalle'],
  ['idli', 'idly', 'idlee'],
  ['dosa', 'dosai', 'dose', 'dosha'],
  ['roti', 'chapati', 'chapathi', 'phulka', 'fulka'],
  ['curd', 'yogurt', 'yoghurt', 'dahi', 'thayir', 'perugu', 'mosaru'],
  ['brinjal', 'eggplant', 'aubergine', 'baingan', 'vankaya', 'kathirikai'],
  ['okra', 'bhindi', 'ladyfinger', 'bendakaya', 'vendakkai'],
  ['chickpea', 'chana', 'chole', 'garbanzo', 'kabuli'],
  ['prawn', 'shrimp', 'jhinga', 'royyalu', 'eral'],
  ['coriander', 'cilantro', 'kothimbir', 'dhania', 'kothamalli'],
  ['capsicum', 'bellpepper', 'pepper'],
  ['potato', 'aloo', 'alu', 'batata', 'urulai'],
  ['cauliflower', 'gobi', 'gobhi'],
  ['paneer', 'cottage'],
  ['peas', 'matar', 'mutter'],
  ['spinach', 'palak', 'palakura', 'keerai'],
  ['buttermilk', 'chaas', 'majjiga', 'mor', 'chhach'],
  ['fries', 'chips'],
  ['zucchini', 'courgette'],
  ['cookie', 'biscuit'],
  ['mince', 'keema', 'kheema', 'ground'],
  ['mutton', 'goat', 'lamb'],
  ['tea', 'chai', 'chaya'],
  ['coffee', 'kaapi', 'kapi'],
  ['egg', 'anda', 'muttai', 'guddu'],
  ['chicken', 'murgh', 'kodi', 'kozhi'],
  ['fish', 'machli', 'meen', 'chepa'],
  ['rice', 'chawal', 'annam', 'sadam', 'arroz', 'nasi'],
  ['lentil', 'dal', 'daal', 'dhal', 'pappu', 'paruppu'],
  ['oats', 'oatmeal', 'porridge'],
  ['semolina', 'rava', 'sooji', 'suji'],
  ['vermicelli', 'semiya', 'sevai', 'seviyan'],
];
const SYN = new Map<string, Set<string>>();
for (const group of SYNONYMS) {
  const folded = new Set(group.map(fold));
  for (const w of folded) SYN.set(w, new Set([...(SYN.get(w) ?? []), ...folded]));
}

/** Damerau-Levenshtein distance with an early exit above `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const n = a.length;
  const m = b.length;
  let prev2: number[] = [];
  let prev = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[m];
}

type Field = 0 | 1 | 2 | 3 | 4; // name, alias, local name, brand, keyword
const FIELD_WEIGHT = [1, 0.92, 0.9, 0.6, 0.6];

interface Entry {
  food: SearchFood;
  nameNorm: string;
  phrases: string[];
  firstToken: string;
}

export class FoodIndex {
  private entries: Entry[] = [];
  /** folded token -> entry index -> best field. */
  private postings = new Map<string, Map<number, Field>>();
  private vocab: string[] = [];

  constructor(foods: SearchFood[]) {
    for (const f of foods) this.add(f);
    this.vocab = [...this.postings.keys()];
  }

  get size(): number {
    return this.entries.length;
  }

  private add(food: SearchFood) {
    const i = this.entries.length;
    const nameNorm = normalize(food.name);
    const phrases = [nameNorm, ...(food.aliases ?? []).map(normalize), ...Object.values(food.names ?? {}).map(normalize)];
    this.entries.push({ food, nameNorm, phrases, firstToken: fold(words(food.name)[0] ?? '') });
    const put = (text: string, field: Field) => {
      for (const w of words(text)) {
        const t = fold(w);
        const m = this.postings.get(t) ?? new Map<number, Field>();
        const prev = m.get(i);
        if (prev === undefined || field < prev) m.set(i, field);
        this.postings.set(t, m);
      }
    };
    put(food.name, 0);
    for (const a of food.aliases ?? []) put(a, 1);
    for (const n of Object.values(food.names ?? {})) put(n, 2);
    if (food.brand) put(food.brand, 3);
    for (const k of food.keywords ?? []) put(k, 4);
  }

  /** Vocabulary tokens matching one query word, with a match strength in (0, 1]. */
  private expand(q: string): Map<string, number> {
    const out = new Map<string, number>();
    const set = (t: string, s: number) => out.set(t, Math.max(out.get(t) ?? 0, s));
    const fq = fold(q);
    if (this.postings.has(fq)) set(fq, 1);
    for (const syn of SYN.get(fq) ?? []) if (syn !== fq && this.postings.has(syn)) set(syn, 0.85);
    const latin = /^[a-z0-9]+$/.test(fq);
    const maxEdit = !latin || fq.length < 4 ? 0 : fq.length < 7 ? 1 : 2;
    for (const t of this.vocab) {
      if (t === fq) continue;
      if (t.startsWith(fq) && fq.length >= 2) set(t, 0.78 - Math.min(0.2, (t.length - fq.length) * 0.02));
      else if (fq.length >= 4 && t.includes(fq)) set(t, 0.55);
      else if (maxEdit && Math.abs(t.length - fq.length) <= maxEdit && t[0] === fq[0]) {
        const d = editDistance(fq, t, maxEdit);
        if (d <= maxEdit) set(t, d === 1 ? 0.62 : 0.45);
      }
    }
    return out;
  }

  search(query: string, opts: SearchOptions = {}): SearchResult {
    const qWords = [...new Set(words(query))].slice(0, 8);
    if (!qWords.length) return { items: [], total: 0, partial: false };
    const qNorm = normalize(query);
    // entry -> per query word best weighted strength
    const scores = new Map<number, number[]>();
    qWords.forEach((w, qi) => {
      for (const [token, strength] of this.expand(w)) {
        for (const [entry, field] of this.postings.get(token)!) {
          const s = strength * FIELD_WEIGHT[field];
          const arr = scores.get(entry) ?? new Array<number>(qWords.length).fill(0);
          if (s > arr[qi]) arr[qi] = s;
          scores.set(entry, arr);
        }
      }
    });
    const need = qWords.length;
    const rankOf = (allowMissing: number) => {
      const out: Array<{ i: number; score: number }> = [];
      for (const [i, arr] of scores) {
        const matched = arr.filter((x) => x > 0).length;
        if (matched < need - allowMissing) continue;
        const e = this.entries[i];
        let score = arr.reduce((a, b) => a + b, 0) / need;
        if (e.phrases.includes(qNorm)) score += e.nameNorm === qNorm ? 1 : 0.8;
        else if (e.nameNorm.startsWith(qNorm)) score += 0.25;
        else if (e.phrases.some((p) => p.startsWith(`${qNorm} `))) score += 0.2;
        if (e.firstToken === fold(qWords[0])) score += 0.15;
        if (opts.country && e.food.countries?.length) score += e.food.countries.includes(opts.country) ? 0.5 : -0.15;
        if (opts.language && e.food.names?.[opts.language] && normalize(e.food.names[opts.language]).includes(qNorm)) score += 0.2;
        score += (e.food.rank ?? 50) / 250;
        score -= Math.min(0.35, words(e.food.name).length / 28);
        if (matched < need) score -= 0.6;
        out.push({ i, score });
      }
      return out;
    };
    let ranked = rankOf(0);
    let partial = false;
    if (ranked.length < 3 && need >= 2) {
      ranked = rankOf(1);
      partial = ranked.length > 0;
    }
    ranked.sort((a, b) => b.score - a.score || this.entries[a.i].food.name.length - this.entries[b.i].food.name.length);
    // Collapse foods with the same name from different datasets: the best-ranked one stays.
    const seen = new Set<string>();
    const unique: SearchFood[] = [];
    for (const { i } of ranked) {
      const e = this.entries[i];
      const key = `${e.nameNorm}|${e.food.brand ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(e.food);
    }
    const offset = Math.max(0, opts.offset ?? 0);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 30));
    return { items: unique.slice(offset, offset + limit), total: unique.length, partial };
  }
}
