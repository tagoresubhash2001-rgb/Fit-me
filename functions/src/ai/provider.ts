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
    this.client = new GoogleGenAI({ apiKey });
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
