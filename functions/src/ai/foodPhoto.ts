import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from '../lib/admin';
import { requireEnabled } from '../lib/features';
import { callableOptions, requireAuth } from '../lib/callable';
import { requireFeature } from '../lib/entitlements';
import { consume } from '../lib/rateLimit';
import { dailyLimit } from '../lib/limits';
import { provider, GEMINI_API_KEY } from './runtime';
import { AIUnavailableError } from './provider';
import { languageName } from './personas';
import { getIndex } from '../foods/searchFunction';
import { fold, words, type SearchFood } from '../foods/search';

const Range = z.object({ min: z.number().min(0).max(5000), max: z.number().min(0).max(5000) }).refine((r) => r.max >= r.min);

/** What the vision model must return. Portions are ranges; nothing is presented as measured. */
export const PhotoEstimate = z.object({
  isFood: z.boolean(),
  quality: z.enum(['good', 'dark', 'blurry', 'too_far', 'partial']),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        searchName: z.string().min(1).max(80),
        localName: z.string().max(120).optional(),
        portion: z.string().min(1).max(120),
        grams: Range,
        calories: Range,
        proteinG: Range,
        carbsG: Range,
        fatG: Range,
        fiberG: Range,
        confidence: z.enum(['low', 'medium', 'high']),
      }),
    )
    .max(10),
});
export type PhotoEstimate = z.infer<typeof PhotoEstimate>;

const range = { type: 'object', properties: { min: { type: 'number' }, max: { type: 'number' } }, required: ['min', 'max'] };
const PHOTO_JSON_SCHEMA = {
  type: 'object',
  properties: {
    isFood: { type: 'boolean' },
    quality: { type: 'string', enum: ['good', 'dark', 'blurry', 'too_far', 'partial'] },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          searchName: { type: 'string' },
          localName: { type: 'string' },
          portion: { type: 'string' },
          grams: range,
          calories: range,
          proteinG: range,
          carbsG: range,
          fatG: range,
          fiberG: range,
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['name', 'searchName', 'portion', 'grams', 'calories', 'proteinG', 'carbsG', 'fatG', 'fiberG', 'confidence'],
      },
    },
  },
  required: ['isFood', 'quality', 'items'],
};

export function parsePhotoEstimate(raw: string): PhotoEstimate | null {
  try {
    const r = PhotoEstimate.safeParse(JSON.parse(raw));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

/** Best database match for a detected item: the top search result, if it shares a real word with the name. */
export function bestMatch(results: SearchFood[], name: string): SearchFood | null {
  const want = new Set(words(name).map(fold));
  for (const f of results.slice(0, 5)) {
    const have = [...words(f.name), ...(f.aliases ?? []).flatMap(words)].map(fold);
    if (have.some((w) => want.has(w))) return f;
  }
  return null;
}

const MAX_BASE64 = 2_800_000; // about 2 MB of JPEG after client compression
const Input = z.object({
  imageBase64: z.string().min(1000).max(MAX_BASE64).regex(/^[A-Za-z0-9+/=]+$/),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  country: z.string().regex(/^[A-Z]{2}$/).optional(),
  language: z.string().min(2).max(8).optional(),
});

/** Magic bytes: the payload must really be the image type it claims. */
export function sniffImage(base64: string): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  const b = Buffer.from(base64.slice(0, 24), 'base64');
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

/**
 * Scan a meal photo (Premium). Detects foods and portion ranges with the configured vision model, matches each
 * to the FitMe food database and returns both; the app shows them for correction and saves only what the user
 * confirms. The photo itself is not stored.
 */
export const analyzeFoodPhoto = onCall(callableOptions({ secrets: [GEMINI_API_KEY], timeoutSeconds: 60, memory: '1GiB' }), async (req) => {
  const uid = await requireAuth(req);
  const parsed = Input.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_image');
  const { imageBase64, mimeType, country, language } = parsed.data;
  if (sniffImage(imageBase64) !== mimeType) throw new HttpsError('invalid-argument', 'invalid_image');
  await requireEnabled('photoScan');
  const plan = await requireFeature(uid, 'foodPhotoScan');
  await consume(uid, 'foodPhotoScan', await dailyLimit('foodPhotoScan', plan));

  const system = [
    'You identify foods in a meal photo and estimate portions. Return JSON only.',
    'isFood: false if the photo shows no food or drink. quality: "dark" if too dark, "blurry" if out of focus, "too_far" if the food is too small to judge, "partial" if cut off, else "good".',
    'List each distinct food or drink separately (e.g. "Masala dosa", "Coconut chutney", "Sambar").',
    'name: the common dish name in English. searchName: 1 to 4 plain English words to look the dish up in a food database (no brand, no adjectives such as "delicious").',
    `localName: the dish name in ${languageName(language)} if it has one, else omit. portion: a household measure (e.g. "1 piece", "1 katori", "1 cup").`,
    `Give ranges (min and max) for grams, calories, protein, carbs, fat and fiber that reflect real uncertainty; typical portions for country ${country ?? 'unknown'}.`,
    'Never invent foods you cannot see. No health claims. No emojis.',
  ].join('\n');

  let raw: string;
  try {
    raw = await provider().generate({
      system,
      turns: [{ role: 'user', text: 'Identify the foods in this photo.' }],
      images: [{ mimeType, base64: imageBase64 }],
      jsonSchema: PHOTO_JSON_SCHEMA,
      temperature: 0.2,
      timeoutMs: 45000,
    });
  } catch (e) {
    logger.warn('analyzeFoodPhoto provider failure', { uid, error: (e as Error).message });
    if (e instanceof AIUnavailableError) throw new HttpsError('unavailable', 'ai_unavailable');
    throw e;
  }
  const estimate = parsePhotoEstimate(raw);
  if (!estimate) throw new HttpsError('unavailable', 'ai_bad_output');

  let index: Awaited<ReturnType<typeof getIndex>> | null = null;
  try {
    index = await getIndex();
  } catch (e) {
    logger.warn('food index unavailable for photo matching', { error: (e as Error).message });
  }
  const items = estimate.items.map((it) => {
    const results = index ? index.search(it.searchName, { country, language, limit: 5 }).items : [];
    const m = bestMatch(results, it.searchName) ?? bestMatch(results, it.name);
    return {
      ...it,
      match: m ? { id: m.id, name: m.name, names: m.names, source: m.source, dataset: m.dataset, per100g: m.per100g, servings: m.servings } : null,
    };
  });
  await db()
    .collection('aiUsage')
    .add({ uid, feature: 'foodPhotoScan', plan, items: items.length, quality: estimate.quality, at: FieldValue.serverTimestamp() });
  return { isFood: estimate.isFood, quality: estimate.quality, items };
});
