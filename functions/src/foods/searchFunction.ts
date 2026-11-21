import { gunzipSync } from 'node:zlib';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { z } from 'zod';
import { bucket, db } from '../lib/admin';
import { callableOptions, requireAuth } from '../lib/callable';
import { featureAllowed } from '../lib/entitlements';
import { FoodIndex } from './search';
import { INDEX_META, INDEX_PATH, type IndexFood } from './indexMeta';

const Input = z.object({
  q: z.string().trim().min(1).max(80),
  offset: z.number().int().min(0).max(2000).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  country: z.string().regex(/^[A-Z]{2}$/).optional(),
  language: z.string().min(2).max(8).optional(),
});

let cache: { builtAt: number; overlayAt: number; checkedAt: number; index: FoodIndex; base: IndexFood[] } | null = null;
let loading: Promise<FoodIndex> | null = null;
const REFRESH_MS = 5 * 60 * 1000;

/** Foods added or edited after the index was built (admin edits, approved user foods), and hidden ones. */
async function overlay(sinceMs: number): Promise<{ upsert: IndexFood[]; hidden: Set<string>; latest: number }> {
  const snap = await db().collection('foods').where('updatedAt', '>', new Date(sinceMs)).orderBy('updatedAt').limit(1000).get();
  const upsert: IndexFood[] = [];
  const hidden = new Set<string>();
  let latest = sinceMs;
  for (const d of snap.docs) {
    const f = d.data();
    latest = Math.max(latest, f.updatedAt?.toMillis?.() ?? sinceMs);
    if (f.status === 'hidden') {
      hidden.add(d.id);
      continue;
    }
    upsert.push({
      id: d.id,
      name: f.name,
      names: f.names,
      aliases: f.aliases,
      keywords: f.keywords,
      brand: f.brand,
      category: f.category,
      cuisine: f.cuisine,
      countries: f.countries ?? [],
      source: f.source,
      dataset: f.dataset,
      rank: f.rank,
      per100g: f.per100g,
      servings: f.servings ?? [],
      reviewStatus: f.reviewStatus,
    });
  }
  return { upsert, hidden, latest };
}

async function load(): Promise<FoodIndex> {
  const meta = await db().doc(INDEX_META).get();
  const builtAt: number = meta.get('builtAt')?.toMillis?.() ?? 0;
  if (cache && cache.builtAt === builtAt && Date.now() - cache.checkedAt < REFRESH_MS) return cache.index;
  let base = cache?.builtAt === builtAt ? cache.base : null;
  if (!base) {
    const [buf] = await bucket().file(meta.get('path') ?? INDEX_PATH).download();
    base = JSON.parse(gunzipSync(buf).toString('utf8')) as IndexFood[];
  }
  const { upsert, hidden, latest } = await overlay(builtAt);
  if (cache && cache.builtAt === builtAt && cache.overlayAt === latest) {
    cache.checkedAt = Date.now();
    return cache.index;
  }
  const replaced = new Set(upsert.map((f) => f.id));
  const foods = [...base.filter((f) => !replaced.has(f.id) && !hidden.has(f.id)), ...upsert];
  const index = new FoodIndex(foods);
  cache = { builtAt, overlayAt: latest, checkedAt: Date.now(), index, base };
  logger.info('food index loaded', { foods: index.size, builtAt, overlay: upsert.length, hidden: hidden.size });
  return index;
}

export async function getIndex(): Promise<FoodIndex> {
  if (cache && Date.now() - cache.checkedAt < REFRESH_MS) return cache.index;
  loading ??= load().finally(() => (loading = null));
  return loading;
}

/**
 * Food search for every plan (food logging is free). Micronutrients are attached only for plans that include
 * them (PRD section 2), decided here on the server.
 */
export const searchFoods = onCall(callableOptions({ memory: '1GiB', timeoutSeconds: 30, maxInstances: 3 }), async (req) => {
  const uid = await requireAuth(req);
  const parsed = Input.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_input');
  const { q, offset, limit, country, language } = parsed.data;
  const [index, micros] = await Promise.all([
    getIndex().catch((e) => {
      logger.error('food index unavailable', { error: (e as Error).message });
      throw new HttpsError('unavailable', 'index_unavailable');
    }),
    featureAllowed(uid, 'micronutrients'),
  ]);
  const res = index.search(q, { offset, limit, country, language });
  return {
    total: res.total,
    partial: res.partial,
    items: res.items.map((f) => {
      const rest: IndexFood = { ...(f as IndexFood) };
      const m = rest.micros;
      delete rest.micros;
      delete rest.keywords;
      delete rest.rank;
      return micros && m ? { ...rest, per100g: { ...rest.per100g, ...m } } : rest;
    }),
  };
});
