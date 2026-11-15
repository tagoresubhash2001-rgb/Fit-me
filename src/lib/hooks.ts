import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../data/session';
import { localDate, localMinutes } from '../domain/dates';

const tzNow = () => useSession.getState().profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

/** The user's local date, refreshed every minute so the day rolls over at local midnight. */
export function useToday(): string {
  const tz = useSession((s) => s.profile?.timezone);
  const [d, setD] = useState(() => localDate(Date.now(), tz || tzNow()));
  useEffect(() => {
    const tick = () => setD(localDate(Date.now(), tz || tzNow()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [tz]);
  return d;
}

export const nowMinutes = () => localMinutes(Date.now(), tzNow());

/** Locale-aware number formatting for the active UI language. */
export function useFormat() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return {
    lang,
    n: (v: number, digits = 0) => new Intl.NumberFormat(lang, { maximumFractionDigits: digits }).format(v),
    date: (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
      new Intl.DateTimeFormat(lang, { ...opts, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`)),
  };
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}
