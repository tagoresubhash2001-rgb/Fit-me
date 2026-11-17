import { defineSecret } from 'firebase-functions/params';
import { GeminiProvider, ResilientProvider, type AIProvider } from './provider';

export const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
/** Model id; override with the GEMINI_MODEL environment variable. Not a secret. */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
/** Lighter model used when the main one is overloaded. */
export const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite';

let override: AIProvider | null = null;
/** Tests can inject a provider; production always uses Gemini with the Secret Manager key. */
export function setProviderForTests(p: AIProvider | null) {
  override = p;
}

export function provider(): AIProvider {
  if (override) return override;
  const key = GEMINI_API_KEY.value();
  const models = [...new Set([GEMINI_MODEL, GEMINI_FALLBACK_MODEL])];
  return new ResilientProvider(models.map((m) => new GeminiProvider(key, m)));
}
