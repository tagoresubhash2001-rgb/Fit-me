import { localDate, localMinutes } from './dates';

/** Pure helpers that turn Apple Health / Health Connect samples into FitMe daily records (unit tested). */

export interface DaySample {
  startDate: string;
  endDate: string;
  value: number;
  sourceName?: string;
}

/** Daily totals keyed by the user's local date. Buckets from the platform start at local midnight. */
export function byLocalDay(samples: DaySample[], tz: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of samples) {
    if (!Number.isFinite(s.value)) continue;
    const d = localDate(new Date(s.startDate).getTime(), tz);
    out.set(d, (out.get(d) ?? 0) + s.value);
  }
  return out;
}

export interface SleepNight {
  date: string;
  startMinutes: number;
  endMinutes: number;
  durationMin: number;
  source?: string;
}

/**
 * Sleep segments -> one night per wake-up date. Segments closer than 90 minutes join one session; awake and
 * in-bed time are not counted as sleep. Overlapping segments from two sources are merged, not double counted.
 */
export function sleepNights(segments: Array<DaySample & { state?: string }>, tz: string): SleepNight[] {
  const asleep = segments
    .filter((s) => !s.state || !['awake', 'inBed'].includes(s.state))
    .map((s) => ({ start: new Date(s.startDate).getTime(), end: new Date(s.endDate).getTime(), source: s.sourceName }))
    .filter((s) => s.end > s.start)
    .sort((a, b) => a.start - b.start);
  const sessions: Array<{ start: number; end: number; asleepMs: number; source?: string; cursor: number }> = [];
  for (const s of asleep) {
    const last = sessions[sessions.length - 1];
    if (last && s.start - last.end <= 90 * 60000) {
      const from = Math.max(s.start, last.cursor);
      if (s.end > from) last.asleepMs += s.end - from;
      last.end = Math.max(last.end, s.end);
      last.cursor = Math.max(last.cursor, s.end);
    } else sessions.push({ start: s.start, end: s.end, asleepMs: s.end - s.start, source: s.source, cursor: s.end });
  }
  const nights = new Map<string, SleepNight>();
  for (const s of sessions) {
    const durationMin = Math.round(s.asleepMs / 60000);
    if (durationMin < 60) continue; // naps below an hour are not a night's sleep
    const date = localDate(s.end, tz);
    const prev = nights.get(date);
    if (prev && prev.durationMin >= durationMin) continue;
    nights.set(date, { date, startMinutes: localMinutes(s.start, tz), endMinutes: localMinutes(s.end, tz), durationMin: Math.min(durationMin, 24 * 60), source: s.source });
  }
  return [...nights.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Stable record id from a platform id (HealthKit UUID / Health Connect metadata id) or the start time. */
export function deviceRecordId(prefix: string, platformId: string | undefined, startDate: string): string {
  const raw = platformId || startDate;
  return `device-${prefix}-${raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80)}`;
}

/** Human workout name from a platform workout type ("traditionalStrengthTraining" -> "Traditional strength training"). */
export function workoutName(type: string): string {
  const words = type
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return words ? words[0].toUpperCase() + words.slice(1) : 'Workout';
}

/**
 * Minutes in each sleep stage (deep, light, rem, awake) for one night. A segment belongs to the night you wake up
 * from: its end time shifted by six hours gives that date (22:30 on the 20th counts towards the night of the 21st).
 */
export function sleepStageMinutes(segments: Array<{ startDate: string; endDate: string; state?: string }>, night: SleepNight, tz: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of segments) {
    const end = new Date(s.endDate).getTime();
    if (!s.state || !['deep', 'light', 'rem', 'awake'].includes(s.state) || localDate(end + 6 * 3600_000, tz) !== night.date) continue;
    const min = Math.round((end - new Date(s.startDate).getTime()) / 60000);
    if (min > 0) out[`sleep_${s.state}`] = (out[`sleep_${s.state}`] ?? 0) + min;
  }
  return out;
}
