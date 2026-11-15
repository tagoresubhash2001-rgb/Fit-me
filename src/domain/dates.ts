/** Dates: instants are stored in UTC; "today" is the user's local date in their IANA time zone. */
export function localDate(at: Date | number, timeZone: string): string {
  const d = typeof at === 'number' ? new Date(at) : at;
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Weekday 0 (Sunday) – 6 (Saturday) of a calendar date. */
export const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

export function startOfWeek(date: string, weekStart: 0 | 1 | 6): string {
  const diff = (weekday(date) - weekStart + 7) % 7;
  return addDays(date, -diff);
}

/** Minutes since local midnight for an instant in a time zone. */
export function localMinutes(at: Date | number, timeZone: string): number {
  const d = typeof at === 'number' ? new Date(at) : at;
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

export function formatMinutes(mins: number, locale: string): string {
  const d = new Date(Date.UTC(2000, 0, 1, Math.floor(mins / 60), mins % 60));
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(d);
}
