import { describe, expect, it } from 'vitest';
import { SUPPORTED_LANGUAGES } from '../domain/locale';

type Tree = { [k: string]: string | Tree };
const files = import.meta.glob<Tree>('./*.json', { eager: true, import: 'default' });
const flat = (d: Tree, p = ''): Record<string, string> =>
  Object.entries(d).reduce<Record<string, string>>((acc, [k, v]) => {
    if (k === '_meta') return acc;
    return typeof v === 'string' ? { ...acc, [p + k]: v } : { ...acc, ...flat(v, `${p}${k}.`) };
  }, {});
const vars = (s: string) => [...s.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();
const en = flat(files['./en.json']);

describe('translations', () => {
  it('has a file for every launch language', () => {
    for (const l of SUPPORTED_LANGUAGES) expect(files[`./${l}.json`], l).toBeDefined();
  });
  for (const l of SUPPORTED_LANGUAGES.filter((x) => x !== 'en')) {
    it(`${l}: only known keys, same placeholders, no emojis`, () => {
      const t = flat(files[`./${l}.json`]);
      for (const [k, v] of Object.entries(t)) {
        expect(en[k], `${l}: unknown key ${k}`).toBeDefined();
        expect(vars(v), `${l}: ${k}`).toEqual(vars(en[k]));
        expect(/\p{Extended_Pictographic}/u.test(v), `${l}: emoji in ${k}`).toBe(false);
      }
    });
  }
  it('English has no emojis', () => {
    for (const [k, v] of Object.entries(en)) expect(/\p{Extended_Pictographic}/u.test(v), k).toBe(false);
  });
});
