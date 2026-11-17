import { describe, expect, it } from 'vitest';
import { AIUnavailableError, isTransient, ResilientProvider, type AIProvider } from '../src/ai/provider';

const opts = { system: 's', turns: [{ role: 'user' as const, text: 'hi' }] };
const noSleep = { sleep: async () => undefined };

function fake(name: string, results: Array<string | Error>): AIProvider & { calls: number } {
  return {
    name,
    calls: 0,
    async generate() {
      const r = results[Math.min(this.calls++, results.length - 1)];
      if (r instanceof Error) throw r;
      return r;
    },
  };
}

describe('isTransient', () => {
  it('detects overload and rate limits', () => {
    expect(isTransient(new Error('[503] The model is overloaded. High demand'))).toBe(true);
    expect(isTransient(new Error('429 RESOURCE_EXHAUSTED'))).toBe(true);
    expect(isTransient(new Error('API key not valid'))).toBe(false);
  });
});

describe('ResilientProvider', () => {
  it('retries a transient error on the same model', async () => {
    const a = fake('a', [new Error('503 unavailable'), 'ok']);
    expect(await new ResilientProvider([a], noSleep).generate(opts)).toBe('ok');
    expect(a.calls).toBe(2);
  });
  it('falls back to the lighter model when the main one stays overloaded', async () => {
    const a = fake('a', [new Error('503 overloaded')]);
    const b = fake('b', ['fallback']);
    expect(await new ResilientProvider([a, b], noSleep).generate(opts)).toBe('fallback');
    expect(a.calls).toBe(2);
    expect(b.calls).toBe(1);
  });
  it('does not retry a permanent error on the same model', async () => {
    const a = fake('a', [new Error('API key not valid')]);
    const b = fake('b', [new Error('API key not valid')]);
    await expect(new ResilientProvider([a, b], noSleep).generate(opts)).rejects.toBeInstanceOf(AIUnavailableError);
    expect(a.calls).toBe(1);
    expect(b.calls).toBe(1);
  });
  it('waits with backoff between retries', async () => {
    const waits: number[] = [];
    const a = fake('a', [new Error('429'), new Error('429'), 'ok']);
    await new ResilientProvider([a], { attempts: 3, baseDelayMs: 100, sleep: async (ms) => void waits.push(ms) }).generate(opts);
    expect(waits).toHaveLength(2);
    expect(waits[1]).toBeGreaterThanOrEqual(200);
  });
});
