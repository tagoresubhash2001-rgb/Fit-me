/** Date of birth helpers (owner correction 1). Dates are ISO yyyy-mm-dd. */
export const MIN_AGE = 13;
export const MAX_AGE = 110;

export const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

export function daysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 31;
}

export const toIsoDate = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export function parseIsoDate(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
}

/** Full years between a birth date and `today` (both ISO). */
export function ageOn(birthIso: string, todayIso: string): number {
  const b = parseIsoDate(birthIso);
  const t = parseIsoDate(todayIso);
  if (!b || !t) return NaN;
  let age = t.y - b.y;
  if (t.m < b.m || (t.m === b.m && t.d < b.d)) age--;
  return age;
}

export type DobError = 'incomplete' | 'invalid' | 'future' | 'tooYoung' | 'tooOld';

export function validateDob(y: number | '', m: number | '', d: number | '', todayIso: string): DobError | null {
  if (y === '' || m === '' || d === '') return 'incomplete';
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return 'invalid';
  const iso = toIsoDate(y, m, d);
  if (iso > todayIso) return 'future';
  const age = ageOn(iso, todayIso);
  if (age < MIN_AGE) return 'tooYoung';
  if (age > MAX_AGE) return 'tooOld';
  return null;
}

/** Years offered in the picker, newest first. */
export function yearOptions(todayIso: string): number[] {
  const y = parseIsoDate(todayIso)!.y;
  const out: number[] = [];
  for (let yr = y - MIN_AGE; yr >= y - MAX_AGE; yr--) out.push(yr);
  return out;
}
