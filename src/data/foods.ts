import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { normalize, rankFoods, type FoodItem } from '../domain/nutrition';
import type { Nutrients } from '../domain/models';
import { useSession } from './session';

/** Firestore cannot do full-text search, so each food stores prefix tokens and we query the first word. */
export async function searchFoods(q: string, extra: FoodItem[] = []): Promise<FoodItem[]> {
  const norm = normalize(q);
  const words = norm.split(' ').filter((w) => [...w].length >= 2);
  if (!words.length) return [];
  // Firestore can match only one token per query, so query the first two words in parallel and merge.
  const tokens = [...new Set(words.slice(0, 2).map((w) => [...w].slice(0, 15).join('')))];
  const snaps = await Promise.all(
    tokens.map((tok) => getDocs(query(collection(db(), 'foods'), where('searchTokens', 'array-contains', tok), limit(150)))),
  );
  const seen = new Map<string, FoodItem>();
  for (const snap of snaps) for (const d of snap.docs) seen.set(d.id, { id: d.id, ...(d.data() as Omit<FoodItem, 'id'>) });
  const remote = [...seen.values()];
  const matchesAll = (f: FoodItem) => {
    const hay = normalize([f.name, ...Object.values(f.names ?? {})].join(' '));
    return words.every((w) => hay.includes(w));
  };
  const local = extra.filter(matchesAll);
  const { profile } = useSession.getState();
  return rankFoods([...local, ...remote.filter(matchesAll)], q, profile?.country ?? 'US', profile?.language ?? 'en').slice(0, 40);
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
