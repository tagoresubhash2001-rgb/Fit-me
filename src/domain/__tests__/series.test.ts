import { describe, expect, it } from 'vitest';
import { parseRange, seriesFor } from '../series';

describe('seriesFor', () => {
  it('gives one bucket per day for 7 and 30 days', () => {
    expect(seriesFor(7, '2026-11-17', () => 1)).toHaveLength(7);
    const s = seriesFor(30, '2026-11-17', (d) => (d === '2026-11-17' ? 5 : 0));
    expect(s).toHaveLength(30);
    expect(s.at(-1)).toMatchObject({ kind: 'day', start: '2026-11-17', value: 5 });
  });
  it('averages logged days per week for 90 days', () => {
    const s = seriesFor(90, '2026-11-17', (d) => (d.endsWith('1') ? 2000 : 0));
    expect(s.length).toBeGreaterThanOrEqual(13);
    expect(s.every((b) => b.kind === 'week')).toBe(true);
    expect(s.filter((b) => b.value > 0).every((b) => b.value === 2000)).toBe(true);
  });
  it('gives monthly buckets for a year', () => {
    const s = seriesFor(365, '2026-11-17', () => 3);
    expect(s.every((b) => b.kind === 'month')).toBe(true);
    expect(s.length).toBeGreaterThanOrEqual(12);
    expect(s.length).toBeLessThanOrEqual(13);
  });
  it('parses the range from the URL', () => {
    expect(parseRange('90')).toBe(90);
    expect(parseRange('12')).toBe(7);
    expect(parseRange(null)).toBe(7);
  });
});
