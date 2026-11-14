import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from '../lib/admin';
import { callableOptions, requireAuth } from '../lib/callable';
import { requireFeature } from '../lib/entitlements';
import { consume } from '../lib/rateLimit';
import { dailyLimit } from '../lib/limits';
import { provider, GEMINI_API_KEY } from './runtime';
import { AIUnavailableError } from './provider';
import { languageName } from './personas';

const Range = z.object({ min: z.number().min(0).max(5000), max: z.number().min(0).max(5000) }).refine((r) => r.max >= r.min);

/** Shape the model must return. Numbers are ranges, never single "exact" values (PRD section 9). */
export const FoodEstimate = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
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
    .max(12),
  notes: z.string().max(400).optional(),
});
export type FoodEstimate = z.infer<typeof FoodEstimate>;

const range = { type: 'object', properties: { min: { type: 'number' }, max: { type: 'number' } }, required: ['min', 'max'] };
export const FOOD_JSON_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' }, portion: { type: 'string' }, grams: range, calories: range,
          proteinG: range, carbsG: range, fatG: range, fiberG: range,
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['name', 'portion', 'grams', 'calories', 'proteinG', 'carbsG', 'fatG', 'fiberG', 'confidence'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['items'],
};

/** Parses and validates model output; returns null when it is not usable (no invented fallback). */
export function parseEstimate(raw: string): FoodEstimate | null {
  try {
    const r = FoodEstimate.safeParse(JSON.parse(raw));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

const Input = z.object({ text: z.string().trim().min(2).max(500), country: z.string().length(2).optional(), language: z.string().min(2).max(5).optional() });

/**
 * Describe a meal in words → estimated items with ranges. Premium.
 * Returns an estimate only; the client shows it for editing and the user confirms before anything is saved.
 */
export const analyzeFoodText = onCall(callableOptions({ secrets: [GEMINI_API_KEY], timeoutSeconds: 60 }), async (req) => {
  const uid = requireAuth(req);
  const parsed = Input.safeParse(req.data);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'invalid_input');
  const plan = await requireFeature(uid, 'foodTextAnalysis');
  await consume(uid, 'foodTextAnalysis', await dailyLimit('foodTextAnalysis', plan));

  const system = [
    'You estimate the nutrition of meals described in text. Return JSON only.',
    'Split the meal into separate items. For each, give a typical portion for the user\'s country, and ranges (min and max) for grams, calories, protein, carbs, fat and fiber that reflect real portion uncertainty.',
    'Use widely accepted food composition values. If the description is too vague, return a wider range and confidence "low". If it is not food, return an empty items list.',
    `Write item names and portions in ${languageName(parsed.data.language)}. Country: ${parsed.data.country ?? 'unknown'}.`,
    'Never add health claims. No emojis.',
  ].join('\n');

  let raw: string;
  try {
    raw = await provider().generate({ system, turns: [{ role: 'user', text: parsed.data.text }], jsonSchema: FOOD_JSON_SCHEMA, temperature: 0.2 });
  } catch (e) {
    logger.warn('analyzeFoodText provider failure', { uid, error: (e as Error).message });
    if (e instanceof AIUnavailableError) throw new HttpsError('unavailable', 'ai_unavailable');
    throw e;
  }
  const estimate = parseEstimate(raw);
  if (!estimate) throw new HttpsError('unavailable', 'ai_bad_output');
  await db().collection('aiUsage').add({ uid, feature: 'foodTextAnalysis', plan, items: estimate.items.length, at: FieldValue.serverTimestamp() });
  return estimate;
});
