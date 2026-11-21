import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import { foldWord, normalize, rankFoods, type FoodItem } from '../domain/nutrition';
import type { Nutrients } from '../domain/models';
import { useSession } from './session';

export interface FoodSearchPage {
  items: FoodItem[];
  /** All matches on the server (for "Show more"). */
  total: number;
  /** True when no food matched every word, so these are close matches. */
  partial: boolean;
  /** True when the server could not be reached and cached foods were searched instead. */
  offline: boolean;
}

const PAGE = 30;

function matchesAllWords(f: FoodItem, words: string[]): boolean {
  const hay = normalize([f.name, ...Object.values(f.names ?? {}), ...(f.aliases ?? [])].join(' '))
    .split(' ')
    .map(foldWord)
    .join(' ');
  return words.every((w) => hay.includes(foldWord(w)));
}

/** Offline fallback: Firestore prefix tokens (raw and folded) of the first two words, from the local cache. */
async function searchCached(q: string, extra: FoodItem[]): Promise<FoodItem[]> {
  const words = normalize(q)
    .split(' ')
    .filter((w) => [...w].length >= 2);
  if (!words.length) return [];
  const tokens = [...new Set(words.slice(0, 2).flatMap((w) => [w, foldWord(w)]).map((w) => [...w].slice(0, 15).join('')))];
  const snaps = await Promise.all(tokens.map((tok) => getDocs(query(collection(db(), 'foods'), where('searchTokens', 'array-contains', tok), limit(150)))));
  const seen = new Map<string, FoodItem>();
  for (const snap of snaps) for (const d of snap.docs) seen.set(d.id, { id: d.id, ...(d.data() as Omit<FoodItem, 'id'>) });
  const { profile } = useSession.getState();
  const all = [...extra.filter((f) => matchesAllWords(f, words)), ...[...seen.values()].filter((f) => matchesAllWords(f, words))];
  return rankFoods(all, q, profile?.country ?? 'US', profile?.language ?? 'en');
}

/**
 * Food search: the server index (all datasets, fuzzy, alias-aware, paged). Your own foods and recipes are
 * matched locally and shown first. Falls back to the cached foods when offline.
 */
export async function searchFoodsPage(q: string, extra: FoodItem[] = [], offset = 0): Promise<FoodSearchPage> {
  const words = normalize(q).split(' ').filter(Boolean);
  if (!words.length) return { items: [], total: 0, partial: false, offline: false };
  const { profile } = useSession.getState();
  const local = offset === 0 ? extra.filter((f) => matchesAllWords(f, words)) : [];
  try {
    const call = httpsCallable<
      { q: string; offset: number; limit: number; country?: string; language?: string },
      { items: FoodItem[]; total: number; partial: boolean }
    >(functions(), 'searchFoods', { timeout: 12000 });
    const res = (
      await call({
        q: q.trim().slice(0, 80),
        offset,
        limit: PAGE,
        ...(profile?.country && /^[A-Z]{2}$/.test(profile.country) ? { country: profile.country } : {}),
        ...(profile?.language ? { language: profile.language } : {}),
      })
    ).data;
    return { items: [...local, ...res.items], total: res.total + local.length, partial: res.partial, offline: false };
  } catch (e) {
    if (offset > 0) throw e;
    const items = await searchCached(q, extra);
    return { items, total: items.length, partial: false, offline: true };
  }
}

/** First page only (recipe ingredients). */
export async function searchFoods(q: string, extra: FoodItem[] = []): Promise<FoodItem[]> {
  return (await searchFoodsPage(q, extra)).items;
}

/** A custom food is stored per serving; convert to per-100 g when grams are known, else treat 1 serving = 100 "units". */
export function customToFoodItem(
  c: { id: string; name: string; servingLabel: string; grams: number | null; nutrients: Nutrients },
  source: FoodItem['source'] = 'custom',
): FoodItem {
  const g = c.grams && c.grams > 0 ? c.grams : 100;
  const f = 100 / g;
  const n = c.nutrients;
  return {
    id: c.id,
    name: c.name,
    source,
    per100g: {
      calories: n.calories * f,
      proteinG: n.proteinG * f,
      carbsG: n.carbsG * f,
      fatG: n.fatG * f,
      fiberG: n.fiberG * f,
      ...(n.sugarG !== undefined ? { sugarG: n.sugarG * f } : {}),
      ...(n.sodiumMg !== undefined ? { sodiumMg: n.sodiumMg * f } : {}),
    },
    servings: [{ label: c.servingLabel || '1', grams: g }],
  };
}

export interface AiFoodEstimate {
  items: Array<{
    name: string;
    portion: string;
    grams: { min: number; max: number };
    calories: { min: number; max: number };
    proteinG: { min: number; max: number };
    carbsG: { min: number; max: number };
    fatG: { min: number; max: number };
    fiberG: { min: number; max: number };
    confidence: 'low' | 'medium' | 'high';
  }>;
  notes?: string;
}

/** AI nutrition estimate for a food that is not in the database (server, Gemini). Never saved by itself. */
export async function estimateFoodWithAi(text: string): Promise<AiFoodEstimate> {
  const { profile } = useSession.getState();
  const call = httpsCallable<{ text: string; country?: string; language?: string }, AiFoodEstimate>(functions(), 'analyzeFoodText', { timeout: 60000 });
  return (
    await call({
      text: text.trim().slice(0, 500),
      ...(profile?.country && /^[A-Z]{2}$/.test(profile.country) ? { country: profile.country } : {}),
      ...(profile?.language ? { language: profile.language.slice(0, 5) } : {}),
    })
  ).data;
}
