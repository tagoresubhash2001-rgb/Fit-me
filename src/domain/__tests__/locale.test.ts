import { describe, expect, it } from 'vitest';
import { detectLocale, currencyForCountry, unitsForCountry, matchLanguage, countryFrom, isRtl, weekStartForCountry } from '../locale';
import { kgToLb, lbToKg, cmToFtIn, ftInToCm, mlToFlOz, formatVolume, formatWeight } from '../units';
import { localDate, addDays, startOfWeek, dateRange, localMinutes, weekday } from '../dates';

describe('locale detection', () => {
  it('India / Telugu device', () => {
    expect(detectLocale(['te-IN', 'en-IN'], 'Asia/Kolkata')).toEqual({
      country: 'IN',
      language: 'te',
      currency: 'INR',
      units: 'metric',
      timezone: 'Asia/Kolkata',
      weekStart: 0,
    });
  });
  it('US English device uses imperial and USD', () => {
    const l = detectLocale(['en-US'], 'America/Chicago');
    expect(l.units).toBe('imperial');
    expect(l.currency).toBe('USD');
  });
  it('eurozone and UK currencies', () => {
    expect(currencyForCountry('DE')).toBe('EUR');
    expect(currencyForCountry('FR')).toBe('EUR');
    expect(currencyForCountry('GB')).toBe('GBP');
    expect(currencyForCountry('ZZ')).toBe('USD');
    expect(unitsForCountry('GB')).toBe('metric');
  });
  it('falls back to English and to the time zone country', () => {
    expect(matchLanguage(['ja-JP', 'zh'])).toBe('en');
    expect(matchLanguage(['pt-BR'])).toBe('pt');
    expect(countryFrom(['en'], 'Asia/Jakarta')).toBe('ID');
    expect(countryFrom(['ar'], 'Unknown/Zone')).toBe('US');
  });
  it('RTL and week start', () => {
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('te')).toBe(false);
    expect(weekStartForCountry('DE')).toBe(1);
    expect(weekStartForCountry('AE')).toBe(6);
  });
});

describe('units', () => {
  it('round-trips weight, height and volume', () => {
    expect(kgToLb(1)).toBeCloseTo(2.20462, 4);
    expect(lbToKg(kgToLb(72))).toBeCloseTo(72, 8);
    expect(cmToFtIn(180)).toEqual({ ft: 5, inch: 11 });
    expect(ftInToCm(5, 11)).toBeCloseTo(180.34, 2);
    expect(mlToFlOz(250)).toBeCloseTo(8.45, 2);
    expect(formatVolume(2500, 'metric', 'en')).toBe('2.5 L');
    expect(formatVolume(250, 'metric', 'en')).toBe('250 ml');
    expect(formatWeight(70, 'imperial', 'en')).toBe('154.3 lb');
  });
});

describe('dates', () => {
  it('computes today in the user time zone', () => {
    const t = Date.UTC(2026, 10, 14, 20, 30);
    expect(localDate(t, 'Asia/Kolkata')).toBe('2026-11-15');
    expect(localDate(t, 'America/Los_Angeles')).toBe('2026-11-14');
    expect(localMinutes(t, 'Asia/Kolkata')).toBe(2 * 60);
  });
  it('date arithmetic', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(dateRange('2026-11-13', '2026-11-15')).toEqual(['2026-11-13', '2026-11-14', '2026-11-15']);
    expect(weekday('2026-11-14')).toBe(6); // Saturday
    expect(startOfWeek('2026-11-14', 1)).toBe('2026-11-09');
    expect(startOfWeek('2026-11-14', 0)).toBe('2026-11-08');
    expect(startOfWeek('2026-11-14', 6)).toBe('2026-11-14');
  });
});
