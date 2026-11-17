import { GoogleGenAI } from '@google/genai';

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface GenerateOptions {
  system: string;
  turns: ChatTurn[];
  /** When set, the model is asked for JSON matching this JSON schema. */
  jsonSchema?: Record<string, unknown>;
  temperature?: number;
  timeoutMs?: number;
  images?: Array<{ mimeType: string; base64: string }>;
}

/** Model provider interface (PRD section 5: the provider must be swappable). */
export interface AIProvider {
  readonly name: string;
  generate(opts: GenerateOptions): Promise<string>;
}

export class AIUnavailableError extends Error {}

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private client: GoogleGenAI;
  constructor(
    apiKey: string,
    private model: string,
  ) {
    // v1beta: the v1 API rejects system instructions ("Developer instruction is not enabled for api version v1").
    this.client = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });
  }

  async generate(opts: GenerateOptions): Promise<string> {
    const contents = opts.turns.map((t, i) => {
      const parts: Array<Record<string, unknown>> = [{ text: t.text }];
      if (i === opts.turns.length - 1 && opts.images?.length) {
        for (const img of opts.images) parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
      }
      return { role: t.role === 'assistant' ? 'model' : 'user', parts };
    });
    const timeout = opts.timeoutMs ?? 25000;
    const call = this.client.models.generateContent({
      model: this.model,
      contents,
      config: {
        systemInstruction: opts.system,
        temperature: opts.temperature ?? 0.6,
        ...(opts.jsonSchema ? { responseMimeType: 'application/json', responseJsonSchema: opts.jsonSchema } : {}),
      },
    });
    const timer = new Promise<never>((_, reject) => setTimeout(() => reject(new AIUnavailableError('timeout')), timeout));
    try {
      const res = await Promise.race([call, timer]);
      const text = res.text?.trim();
      if (!text) throw new AIUnavailableError('empty_response');
      return text;
    } catch (e) {
      if (e instanceof AIUnavailableError) throw e;
      throw new AIUnavailableError((e as Error).message || 'provider_error');
    }
  }
}

/** True for errors worth retrying: overload (503), rate limit (429) and short network blips. */
export function isTransient(e: unknown): boolean {
  const msg = String((e as Error)?.message ?? e).toLowerCase();
  return /\b(503|429|500)\b|unavailable|overloaded|high demand|resource_exhausted|rate limit|econnreset|etimedout|fetch failed/.test(msg);
}

export interface RetryOptions {
  /** Attempts per provider (first try included). */
  attempts?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

/**
 * Tries each provider in order (primary model first, then a lighter fallback model).
 * Transient errors are retried with exponential backoff and jitter; other errors move on at once.
 */
export class ResilientProvider implements AIProvider {
  readonly name: string;
  constructor(
    private providers: AIProvider[],
    private opts: RetryOptions = {},
  ) {
    if (!providers.length) throw new Error('no providers');
    this.name = providers.map((p) => p.name).join('>');
  }

  async generate(o: GenerateOptions): Promise<string> {
    const attempts = this.opts.attempts ?? 2;
    const base = this.opts.baseDelayMs ?? 600;
    const sleep = this.opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
    let last: unknown;
    for (const p of this.providers) {
      for (let i = 0; i < attempts; i++) {
        try {
          return await p.generate(o);
        } catch (e) {
          last = e;
          if (!isTransient(e)) break;
          if (i < attempts - 1) await sleep(base * 2 ** i + Math.floor(Math.random() * 200));
        }
      }
    }
    throw last instanceof AIUnavailableError ? last : new AIUnavailableError(String((last as Error)?.message ?? 'provider_error'));
  }
}
