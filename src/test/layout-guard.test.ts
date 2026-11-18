import { describe, expect, it } from 'vitest';

/**
 * Layout guard (one source, every screen size): feature screens describe content only. Layout widths
 * belong to the shell and the shared layout components (src/app, src/components/ui), never to a screen,
 * and no screen may be duplicated per device.
 */
const screens = import.meta.glob<string>('../features/**/*.tsx', { eager: true, query: '?raw', import: 'default' });

describe('layout guard', () => {
  it('has feature screens to check', () => {
    expect(Object.keys(screens).length).toBeGreaterThan(15);
  });
  it('no hard-coded layout widths in feature screens', () => {
    const bad: string[] = [];
    for (const [file, src] of Object.entries(screens)) {
      // Arbitrary widths of 64 px or more (icons and avatars below that are fine) and inline pixel widths.
      for (const m of src.matchAll(/(?:min-|max-)?w-\[(\d+)px\]/g)) if (Number(m[1]) >= 64) bad.push(`${file}: ${m[0]}`);
      for (const m of src.matchAll(/width:\s*['"]?\d+(px)?['"]?\s*[,}]/g)) bad.push(`${file}: ${m[0]}`);
    }
    expect(bad).toEqual([]);
  });
  it('no per-device copies of a screen', () => {
    const dupes = Object.keys(screens).filter((f) => /(mobile|tablet|desktop|phone|ipad)[^/]*\.tsx$/i.test(f));
    expect(dupes).toEqual([]);
  });
});
