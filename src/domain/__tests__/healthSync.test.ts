import { describe, expect, it } from 'vitest';
import { byLocalDay, deviceRecordId, sleepNights, workoutName } from '../healthSync';

const tz = 'Asia/Kolkata';

describe('device sync helpers', () => {
  it('daily totals use the user local date', () => {
    const m = byLocalDay(
      [
        { startDate: '2026-11-19T18:30:00.000Z', endDate: '2026-11-20T18:30:00.000Z', value: 8000 },
        { startDate: '2026-11-20T18:30:00.000Z', endDate: '2026-11-21T18:30:00.000Z', value: 4500 },
      ],
      tz,
    );
    expect([...m]).toEqual([
      ['2026-11-20', 8000],
      ['2026-11-21', 4500],
    ]);
  });
  it('sleep segments become one night on the wake-up date, without awake time or double counting', () => {
    const nights = sleepNights(
      [
        { startDate: '2026-11-20T17:00:00.000Z', endDate: '2026-11-20T20:00:00.000Z', value: 0, state: 'light' },
        { startDate: '2026-11-20T20:00:00.000Z', endDate: '2026-11-20T20:20:00.000Z', value: 0, state: 'awake' },
        { startDate: '2026-11-20T20:20:00.000Z', endDate: '2026-11-21T00:30:00.000Z', value: 0, state: 'deep' },
        // Same period from a second source (watch and phone): merged, not added.
        { startDate: '2026-11-20T21:00:00.000Z', endDate: '2026-11-20T23:00:00.000Z', value: 0, state: 'asleep' },
      ],
      tz,
    );
    expect(nights).toHaveLength(1);
    expect(nights[0]).toMatchObject({ date: '2026-11-21', durationMin: 430, startMinutes: 22 * 60 + 30, endMinutes: 6 * 60 });
  });
  it('short naps are not a night', () => {
    expect(sleepNights([{ startDate: '2026-11-21T08:00:00.000Z', endDate: '2026-11-21T08:40:00.000Z', value: 0 }], tz)).toEqual([]);
  });
  it('stable ids from platform ids, so a re-sync updates instead of duplicating', () => {
    expect(deviceRecordId('workout', 'A1B2-C3', '2026-11-21T06:00:00Z')).toBe('device-workout-A1B2-C3');
    expect(deviceRecordId('weight', undefined, '2026-11-21T06:00:00Z')).toBe('device-weight-2026-11-21T060000Z');
  });
  it('workout names are readable', () => {
    expect(workoutName('traditionalStrengthTraining')).toBe('Traditional strength training');
    expect(workoutName('RUNNING')).toBe('Running');
  });
});

describe('sleep stages', () => {
  it('adds up minutes per stage for the night', async () => {
    const { sleepStageMinutes } = await import('../healthSync');
    const night = { date: '2026-11-21', startMinutes: 0, endMinutes: 0, durationMin: 0 };
    const m = sleepStageMinutes(
      [
        { startDate: '2026-11-20T17:00:00.000Z', endDate: '2026-11-20T18:00:00.000Z', state: 'light' },
        { startDate: '2026-11-20T18:00:00.000Z', endDate: '2026-11-20T19:30:00.000Z', state: 'deep' },
        { startDate: '2026-11-20T19:30:00.000Z', endDate: '2026-11-20T19:40:00.000Z', state: 'awake' },
        { startDate: '2026-11-20T19:40:00.000Z', endDate: '2026-11-20T20:10:00.000Z', state: 'rem' },
        { startDate: '2026-11-19T19:40:00.000Z', endDate: '2026-11-19T20:10:00.000Z', state: 'rem' },
      ],
      night,
      'Asia/Kolkata',
    );
    expect(m).toEqual({ sleep_light: 60, sleep_deep: 90, sleep_awake: 10, sleep_rem: 30 });
  });
});
