import { describe, expect, it } from 'vitest';
import { parseEstimate } from '../src/ai/foodText';
import { toPlain } from '../src/account/exportData';
import { Timestamp } from 'firebase-admin/firestore';

const r = (min: number, max: number) => ({ min, max });
describe('parseEstimate', () => {
  it('accepts valid ranged output', () => {
    const raw = JSON.stringify({ items: [{ name: 'Idli', portion: '2 pieces', grams: r(80, 120), calories: r(120, 170), proteinG: r(3, 5), carbsG: r(25, 35), fatG: r(0, 1), fiberG: r(1, 2), confidence: 'high' }] });
    expect(parseEstimate(raw)?.items[0].name).toBe('Idli');
  });
  it('rejects malformed output instead of inventing numbers', () => {
    expect(parseEstimate('not json')).toBeNull();
    expect(parseEstimate(JSON.stringify({ items: [{ name: 'x', calories: 200 }] }))).toBeNull();
    expect(parseEstimate(JSON.stringify({ items: [{ name: 'x', portion: 'p', grams: r(5, 1), calories: r(1, 2), proteinG: r(0, 1), carbsG: r(0, 1), fatG: r(0, 1), fiberG: r(0, 1), confidence: 'high' }] }))).toBeNull();
  });
});
describe('toPlain', () => {
  it('serialises timestamps', () => {
    expect(toPlain({ a: Timestamp.fromMillis(0), b: [1, { c: 'x' }] })).toEqual({ a: '1970-01-01T00:00:00.000Z', b: [1, { c: 'x' }] });
  });
});
