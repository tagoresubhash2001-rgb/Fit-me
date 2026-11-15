import type { Nutrients, FoodLog, MealSlot } from './models';

/** A food document from the global `foods` collection (values per 100 g). */
export interface FoodItem {
  id: string;
  name: string;
  names?: Record<string, string>;
  per100g: Nutrients & Record<string, number | undefined>;
  servings: Array<{ label: string; labels?: Record<string, string>; grams: number }>;
  source: 'usda' | 'curated' | 'off' | 'custom';
  sourceId?: string;
  countries?: string[];
  category?: string;
  reviewStatus?: 'approved' | 'pending_review';
}

export const EMPTY_NUTRIENTS: Nutrients = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0, sodiumMg: 0 };

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Nutrients for `grams` of a food given per-100 g values. */
export function scaleNutrients(per100g: Nutrients, grams: number): Nutrients {
  const f = grams / 100;
  return {
    calories: Math.round(per100g.calories * f),
    proteinG: r1(per100g.proteinG * f),
    carbsG: r1(per100g.carbsG * f),
    fatG: r1(per100g.fatG * f),
    fiberG: r1(per100g.fiberG * f),
    ...(per100g.sugarG !== undefined ? { sugarG: r1(per100g.sugarG * f) } : {}),
    ...(per100g.sodiumMg !== undefined ? { sodiumMg: Math.round(per100g.sodiumMg * f) } : {}),
  };
}

export function sumNutrients(list: Nutrients[]): Nutrients {
  const t = { ...EMPTY_NUTRIENTS };
  for (const n of list) {
    t.calories += n.calories;
    t.proteinG += n.proteinG;
    t.carbsG += n.carbsG;
    t.fatG += n.fatG;
    t.fiberG += n.fiberG;
    t.sugarG = (t.sugarG ?? 0) + (n.sugarG ?? 0);
    t.sodiumMg = (t.sodiumMg ?? 0) + (n.sodiumMg ?? 0);
  }
  return {
    calories: Math.round(t.calories),
    proteinG: r1(t.proteinG),
    carbsG: r1(t.carbsG),
    fatG: r1(t.fatG),
    fiberG: r1(t.fiberG),
    sugarG: r1(t.sugarG ?? 0),
    sodiumMg: Math.round(t.sodiumMg ?? 0),
  };
}

export function totalsBySlot(logs: Pick<FoodLog, 'slot' | 'nutrients'>[]): Record<MealSlot, Nutrients> {
  const out = {} as Record<MealSlot, Nutrients>;
  for (const slot of ['breakfast', 'morning_snack', 'lunch', 'evening_snack', 'dinner', 'other'] as MealSlot[]) {
    out[slot] = sumNutrients(logs.filter((l) => l.slot === slot).map((l) => l.nutrients));
  }
  return out;
}

/** Same food in the same slot within `windowMs` counts as a likely duplicate. */
export function isLikelyDuplicate(
  existing: Array<{ foodId: string | null; name: string; slot: MealSlot; createdAtMs?: number }>,
  candidate: { foodId: string | null; name: string; slot: MealSlot },
  nowMs: number,
  windowMs = 10 * 60 * 1000,
): boolean {
  return existing.some(
    (e) =>
      e.slot === candidate.slot &&
      (candidate.foodId ? e.foodId === candidate.foodId : e.name.trim().toLowerCase() === candidate.name.trim().toLowerCase()) &&
      e.createdAtMs !== undefined &&
      nowMs - e.createdAtMs <= windowMs,
  );
}

/** Default meal slot from the local time of day. */
export function slotForMinutes(m: number): MealSlot {
  if (m < 10 * 60 + 30) return 'breakfast';
  if (m < 12 * 60) return 'morning_snack';
  if (m < 15 * 60) return 'lunch';
  if (m < 18 * 60 + 30) return 'evening_snack';
  return 'dinner';
}

/** Normalises text for search tokens: lowercase, strip accents and punctuation (keeps non-Latin letters). */
export function normalize(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/\p{M}+/gu, (m) => (/[ऀ-෿؀-ۿ]/.test(m) ? m : ''))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Prefix tokens (2–15 chars) of every word in every name, used for Firestore array-contains search. */
export function searchTokens(names: string[]): string[] {
  const set = new Set<string>();
  for (const n of names) {
    for (const w of normalize(n).split(' ')) {
      const chars = [...w];
      for (let i = 2; i <= Math.min(15, chars.length); i++) set.add(chars.slice(0, i).join(''));
    }
  }
  return [...set];
}

/** Ranks search results: exact/prefix name match, user's country, curated local dishes. */
export function rankFoods(items: FoodItem[], query: string, country: string, language: string): FoodItem[] {
  const q = normalize(query);
  const score = (f: FoodItem) => {
    const names = [f.name, ...(f.names ? Object.values(f.names) : [])].map(normalize);
    const local = f.names?.[language] ? normalize(f.names[language]) : '';
    let s = 0;
    if (names.some((n) => n === q)) s += 100;
    if (names.some((n) => n.startsWith(q))) s += 40;
    const first = q.split(' ')[0];
    if (first && names.some((n) => n.startsWith(first))) s += 25; // "rice cooked" → names starting with "rice"
    if (q.split(' ').every((w) => names[0].includes(w))) s += 10;
    if (local && local.includes(q)) s += 20;
    if (f.countries?.includes(country)) s += 150; // PRD §9: the user's country ranks first
    if (f.source === 'curated') s += 10;
    if (f.source === 'custom') s += 15;
    s -= Math.min(20, names[0].length / 6);
    return s;
  };
  return [...items].sort((a, b) => score(b) - score(a));
}

export function displayName(f: Pick<FoodItem, 'name' | 'names'>, language: string): string {
  return f.names?.[language] ?? f.name;
}
