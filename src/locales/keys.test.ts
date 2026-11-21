import { describe, expect, it } from 'vitest';
import en from './en.json';

/** Every static t('a.b') key used in the app must exist in English. */
const sources = import.meta.glob<string>(['../**/*.ts', '../**/*.tsx', '!../**/*.test.ts', '!../**/*.test.tsx'], {
  eager: true,
  query: '?raw',
  import: 'default',
});

const has = (key: string) => {
  let d: unknown = en;
  for (const p of key.split('.')) {
    if (typeof d !== 'object' || d === null || !(p in d)) return false;
    d = (d as Record<string, unknown>)[p];
  }
  return typeof d === 'string';
};

describe('translation keys', () => {
  it('every static key used in code exists in en.json', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(40);
    const missing: string[] = [];
    for (const [file, src] of Object.entries(sources)) {
      // i18next plurals: t('a.b', { count }) resolves a.b_one / a.b_other.
      for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) if (!has(m[1]) && !(has(`${m[1]}_one`) && has(`${m[1]}_other`))) missing.push(`${file}: ${m[1]}`);
    }
    expect(missing).toEqual([]);
  });
});
