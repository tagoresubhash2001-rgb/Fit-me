/** Local calendar date (YYYY-MM-DD) for an instant in an IANA time zone. */
export function localDate(nowMs: number, tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
      new Date(nowMs),
    );
    return parts;
  } catch {
    return new Date(nowMs).toISOString().slice(0, 10);
  }
}

export function daysBefore(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}
