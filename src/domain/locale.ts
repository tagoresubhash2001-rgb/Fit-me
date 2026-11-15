/** Country, currency, units, language and time zone detection (PRD section 4). Pure; unit tested. */
import type { UnitSystem } from './units';

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'te', 'ta', 'es', 'pt', 'fr', 'de', 'ar', 'id'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const RTL_LANGUAGES: Language[] = ['ar'];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
  te: 'తెలుగు',
  ta: 'தமிழ்',
  es: 'Español',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  ar: 'العربية',
  id: 'Bahasa Indonesia',
};

const EUROZONE = ['AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES'];
const CURRENCY: Record<string, string> = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  ID: 'IDR',
  BR: 'BRL',
  MX: 'MXN',
  AE: 'AED',
  SA: 'SAR',
  EG: 'EGP',
  CA: 'CAD',
  AU: 'AUD',
  SG: 'SGD',
  MY: 'MYR',
  LK: 'LKR',
  BD: 'BDT',
  PK: 'PKR',
  NP: 'NPR',
  JP: 'JPY',
  CH: 'CHF',
  AR: 'ARS',
  CO: 'COP',
  CL: 'CLP',
  PE: 'PEN',
  NG: 'NGN',
  ZA: 'ZAR',
  KE: 'KES',
  MA: 'MAD',
  QA: 'QAR',
  KW: 'KWD',
};
const IMPERIAL = ['US', 'LR', 'MM'];

/** Rough time zone → country fallback when the device language has no region. */
const TZ_COUNTRY: Record<string, string> = {
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Europe/London': 'GB',
  'Asia/Jakarta': 'ID',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Africa/Cairo': 'EG',
  'America/Sao_Paulo': 'BR',
  'America/Mexico_City': 'MX',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Madrid': 'ES',
  'Europe/Lisbon': 'PT',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'Asia/Singapore': 'SG',
  'Australia/Sydney': 'AU',
  'America/Toronto': 'CA',
};

export function currencyForCountry(country: string): string {
  if (EUROZONE.includes(country)) return 'EUR';
  return CURRENCY[country] ?? 'USD';
}

export function unitsForCountry(country: string): UnitSystem {
  return IMPERIAL.includes(country) ? 'imperial' : 'metric';
}

export function matchLanguage(candidates: readonly string[]): Language {
  for (const c of candidates) {
    const base = c.toLowerCase().split(/[-_]/)[0];
    if ((SUPPORTED_LANGUAGES as readonly string[]).includes(base)) return base as Language;
  }
  return 'en';
}

export function countryFrom(candidates: readonly string[], timeZone: string): string {
  for (const c of candidates) {
    const m = /^[a-z]{2,3}[-_]([A-Za-z]{2})\b/.exec(c);
    if (m) return m[1].toUpperCase();
  }
  return TZ_COUNTRY[timeZone] ?? 'US';
}

export function weekStartForCountry(country: string): 0 | 1 | 6 {
  if (['US', 'CA', 'BR', 'MX', 'IN', 'JP', 'ID', 'IL', 'PH', 'ZA', 'AU'].includes(country)) return 0; // Sunday
  if (['AE', 'SA', 'EG', 'QA', 'KW', 'BH', 'OM', 'JO'].includes(country)) return 6; // Saturday
  return 1; // Monday
}

export interface LocaleSettings {
  country: string;
  language: Language;
  currency: string;
  units: UnitSystem;
  timezone: string;
  weekStart: 0 | 1 | 6;
}

export function detectLocale(languages: readonly string[], timeZone: string): LocaleSettings {
  const country = countryFrom(languages, timeZone);
  return {
    country,
    language: matchLanguage(languages),
    currency: currencyForCountry(country),
    units: unitsForCountry(country),
    timezone: timeZone || 'UTC',
    weekStart: weekStartForCountry(country),
  };
}

export function detectDeviceLocale(): LocaleSettings {
  const langs = typeof navigator !== 'undefined' ? (navigator.languages?.length ? navigator.languages : [navigator.language]) : ['en-US'];
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return detectLocale(langs, tz);
}

export const isRtl = (lang: string) => (RTL_LANGUAGES as string[]).includes(lang);
