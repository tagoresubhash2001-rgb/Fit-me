import { describe, expect, it } from 'vitest';
import { pickDaily, stepStats, stepSourceOf, strideMeters } from '../steps';

describe('daily steps without double counting', () => {
  const day = '2026-11-21';
  it('uses the health platform over the phone counter and a manual entry, never the sum', () => {
    const rows = [
      { id: `phone-${day}`, date: day, steps: 7400 },
      { id: `device-${day}`, date: day, steps: 8100 },
      { id: `manual-${day}`, date: day, steps: 2000 },
    ];
    expect(pickDaily(rows, day)).toMatchObject({ steps: 8100, source: 'health' });
  });
  it('a cloud wearable beats the phone; the phone beats manual', () => {
    expect(pickDaily([{ id: `phone-${day}`, date: day, steps: 9000 }, { id: `cloud-garmin-${day}`, date: day, steps: 8800 }], day).source).toBe('cloud');
    expect(pickDaily([{ id: `phone-${day}`, date: day, steps: 300 }, { id: `manual-${day}`, date: day, steps: 5000 }], day).steps).toBe(300);
  });
  it('ignores other days and empty rows', () => {
    expect(pickDaily([{ id: 'device-2026-11-20', date: '2026-11-20', steps: 5000 }, { id: `device-${day}`, date: day, steps: 0 }], day)).toMatchObject({ steps: 0, source: null });
  });
  it('classifies sources by record id', () => {
    expect(stepSourceOf({ id: 'device-2026-11-21' })).toBe('health');
    expect(stepSourceOf({ id: 'abc' })).toBe('manual');
  });
  it('distance and calories from height and weight', () => {
    expect(strideMeters(170)).toBeCloseTo(0.7055, 4);
    expect(strideMeters(null)).toBe(0.762);
    expect(stepStats(10000, 170, 70)).toEqual({ km: 7.06, kcal: 350 });
  });
});
