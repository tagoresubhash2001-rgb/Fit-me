import { addDays, dateRange } from './dates';

export const RANGES = [7, 30, 90, 365] as const;
export type RangeDays = (typeof RANGES)[number];

export const parseRange = (v: string | null | undefined): RangeDays => {
  const n = Number(v);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 7;
};

export interface Bucket {
  kind: 'day' | 'week' | 'month';
  /** First date in the bucket (yyyy-mm-dd). */
  start: string;
  end: string;
  value: number;
}

/**
 * Chart buckets for a time range ending today: one bar per day for 7 and 30 days, per week for 90 days,
 * per month for a year. Weekly and monthly values are the average of the days that have data, so a
 * week with three logged days is not dragged down by days the user did not log.
 */
export function seriesFor(range: RangeDays, today: string, valueOn: (date: string) => number): Bucket[] {
  const from = addDays(today, -(range - 1));
  const days = dateRange(from, today);
  if (range <= 30) return days.map((d) => ({ kind: 'day', start: d, end: d, value: valueOn(d) }));
  const groups = new Map<string, string[]>();
  const kind = range === 90 ? 'week' : 'month';
  days.forEach((d, i) => {
    const key = kind === 'week' ? String(Math.floor(i / 7)) : d.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), d]);
  });
  return [...groups.values()].map((ds) => {
    const vals = ds.map(valueOn).filter((v) => v > 0);
    return { kind, start: ds[0], end: ds[ds.length - 1], value: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
  });
}

export const rangeStart = (range: RangeDays, today: string) => addDays(today, -(range - 1));
