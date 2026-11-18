import { describe, expect, it } from 'vitest';
import { kgToStLb, stLbToKg, volumeToMl, mlToVolume, defaultUnitPrefs, formatHeightPref, formatWeightPref, formatVolumePref, cmToFtIn, ftInToCm, kgToLb, lbToKg } from '../units';
import { daysInMonth, isLeapYear, ageOn, validateDob, yearOptions, toIsoDate } from '../dob';
import { recommendGoals, conflictWith, calorieGoalFor, normalizePrimary } from '../goals';
import { matchAllergens, matchRestrictions } from '../allergens';
import { unitOptionsFor, nutrientsFor, clampQuantity, stepFor, GENERIC_UNITS } from '../quantity';
import { formatPrice } from '../pricing';

describe('unit conversions', () => {
  it('stone and pounds round trip', () => {
    expect(kgToStLb(63.5029)).toEqual({ st: 10, lb: 0 });
    expect(kgToStLb(70)).toEqual({ st: 11, lb: 0.3 });
    expect(stLbToKg(11, 0.3)).toBeCloseTo(70, 1);
    for (const kg of [40, 55.5, 78, 120.2]) {
      const { st, lb } = kgToStLb(kg);
      expect(stLbToKg(st, lb)).toBeCloseTo(kg, 1);
    }
  });
  it('kg/lb and cm/ft-in round trips stay within rounding', () => {
    for (const kg of [45, 72.4, 150]) expect(lbToKg(kgToLb(kg))).toBeCloseTo(kg, 8);
    for (const cm of [150, 165, 175, 190]) {
      const { ft, inch } = cmToFtIn(cm);
      expect(Math.abs(ftInToCm(ft, inch) - cm)).toBeLessThanOrEqual(1.27);
    }
  });
  it('volumes', () => {
    expect(volumeToMl(1, 'l')).toBe(1000);
    expect(volumeToMl(2, 'cup')).toBe(480);
    expect(volumeToMl(8, 'floz')).toBeCloseTo(236.6, 1);
    for (const u of ['ml', 'l', 'floz', 'cup'] as const) expect(volumeToMl(mlToVolume(750, u), u)).toBeCloseTo(750, 6);
  });
  it('defaults by country', () => {
    expect(defaultUnitPrefs('US')).toEqual({ height: 'ftin', weight: 'lb', volume: 'floz' });
    expect(defaultUnitPrefs('GB')).toEqual({ height: 'ftin', weight: 'stlb', volume: 'ml' });
    expect(defaultUnitPrefs('IN')).toEqual({ height: 'cm', weight: 'kg', volume: 'ml' });
  });
  it('formats in the chosen unit', () => {
    expect(formatHeightPref(180, 'ftin')).toBe('5 ft 11 in');
    expect(formatHeightPref(180, 'cm')).toBe('180 cm');
    expect(formatWeightPref(70, 'stlb')).toBe('11 st 0.3 lb');
    expect(formatWeightPref(70, 'lb')).toBe('154.3 lb');
    expect(formatVolumePref(1500, 'l')).toBe('1.5 L');
    expect(formatVolumePref(480, 'cup')).toBe('2 cups');
  });
});

describe('date of birth', () => {
  it('month lengths and leap years', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(2026, 4)).toBe(30);
  });
  it('age counts birthdays correctly', () => {
    expect(ageOn('1994-11-16', '2026-11-16')).toBe(32);
    expect(ageOn('1994-11-17', '2026-11-16')).toBe(31);
    expect(ageOn('2008-02-29', '2026-02-28')).toBe(17);
  });
  it('validation', () => {
    const today = '2026-11-16';
    expect(validateDob('', 1, 1, today)).toBe('incomplete');
    expect(validateDob(2023, 2, 29, today)).toBe('invalid');
    expect(validateDob(2027, 1, 1, today)).toBe('future');
    expect(validateDob(2015, 1, 1, today)).toBe('tooYoung');
    expect(validateDob(2013, 11, 16, today)).toBeNull(); // exactly 13 today
    expect(validateDob(2013, 11, 17, today)).toBe('tooYoung');
    expect(validateDob(1990, 6, 30, today)).toBeNull();
    expect(toIsoDate(1990, 6, 3)).toBe('1990-06-03');
  });
  it('years newest first, from 13 to 110 years ago', () => {
    const y = yearOptions('2026-11-16');
    expect(y[0]).toBe(2013);
    expect(y.at(-1)).toBe(1916);
  });
});

describe('goals', () => {
  it('recommends from BMI, age and activity', () => {
    expect(recommendGoals(27, 30, 'moderate').map((r) => r.goal)).toEqual(['lose']);
    expect(recommendGoals(17.9, 22, 'sedentary').map((r) => r.goal)).toEqual(['gain', 'improve_fitness']);
    expect(recommendGoals(22, 45, 'very').map((r) => r.goal)).toEqual(['maintain', 'build_muscle']);
    expect(recommendGoals(null, null, null)).toEqual([]);
  });
  it('prevents conflicting weight goals', () => {
    expect(conflictWith('gain', ['lose', 'improve_energy'])).toBe('lose');
    expect(conflictWith('maintain', ['gain'])).toBe('gain');
    expect(conflictWith('build_muscle', ['lose'])).toBeNull();
  });
  it('primary goal drives calories', () => {
    expect(calorieGoalFor('lose')).toBe('lose');
    expect(calorieGoalFor('eat_healthier')).toBe('eating_habits');
    expect(calorieGoalFor('sleep_better')).toBe('wellness');
    expect(normalizePrimary(['sleep_better', 'lose'], null)).toBe('lose');
    expect(normalizePrimary(['sleep_better'], 'lose')).toBe('sleep_better');
    expect(normalizePrimary([], null)).toBeNull();
  });
});

describe('allergens and restrictions', () => {
  it('matches common allergens by name, including local names', () => {
    expect(matchAllergens(['Paneer butter masala'], ['dairy', 'peanuts'])).toEqual(['dairy']);
    expect(matchAllergens(['Chapati / roti', 'చపాతీ'], ['gluten'])).toEqual(['gluten']);
    expect(matchAllergens(['Steamed white rice'], ['gluten', 'dairy'])).toEqual([]);
    expect(matchAllergens(['Peanuts, raw'], ['peanuts'])).toEqual(['peanuts']);
    expect(matchAllergens(['Egg curry'], ['eggs'])).toEqual(['eggs']);
    expect(matchAllergens(['Eggplant, raw'], ['eggs'])).toEqual(['eggs']); // conservative: warns, user decides
  });
  it('custom allergies match their own words', () => {
    expect(matchAllergens(['Mango lassi'], ['mango'])).toEqual(['mango']);
  });
  it('restrictions', () => {
    expect(matchRestrictions(['Chicken curry'], ['vegetarian', 'halal'])).toEqual(['vegetarian']);
    expect(matchRestrictions(['Aloo paratha'], ['jain'])).toEqual(['jain']);
    expect(matchRestrictions(['Egg curry'], ['eggetarian', 'vegetarian'])).toEqual(['vegetarian']);
    expect(matchRestrictions(['Pepperoni pizza'], ['no_pork', 'halal', 'vegan'])).toEqual(['no_pork', 'halal', 'vegan']);
    expect(matchRestrictions(['Steamed white rice'], ['vegan', 'jain', 'halal'])).toEqual([]);
  });
});

describe('quantity and units', () => {
  const labels = Object.fromEntries(GENERIC_UNITS.map((u) => [u, u])) as Record<(typeof GENERIC_UNITS)[number], string>;
  const idli = { servings: [{ label: '1 piece', grams: 40 }] };
  const per100g = { calories: 135, proteinG: 4.5, carbsG: 28, fatG: 0.4, fiberG: 1.2 };
  it('own servings come first, then generic units', () => {
    const opts = unitOptionsFor(idli, labels);
    expect(opts[0]).toMatchObject({ label: '1 piece', grams: 40, approximate: false });
    expect(opts.find((o) => o.id === 'piece')?.grams).toBe(40);
    expect(opts.find((o) => o.id === 'katori')).toMatchObject({ grams: 150, approximate: true });
    expect(unitOptionsFor({ servings: [] }, labels).find((o) => o.id === 'serving')).toMatchObject({ grams: 100, approximate: true });
  });
  it('nutrition follows quantity and unit', () => {
    expect(nutrientsFor(per100g, 3, { grams: 40 }).calories).toBe(162);
    expect(nutrientsFor(per100g, 1.5, { grams: 40 }).calories).toBe(81);
    expect(nutrientsFor(per100g, 150, { grams: 1 }).calories).toBe(203);
  });
  it('stepper steps and limits', () => {
    expect(stepFor('g')).toBe(10);
    expect(stepFor('own-0')).toBe(0.5);
    expect(clampQuantity(0, 'own-0')).toBe(0.5);
    expect(clampQuantity(1.26, 'own-0')).toBe(1.5);
    expect(clampQuantity(99, 'own-0')).toBe(50);
    expect(clampQuantity(12345, 'g')).toBe(5000);
  });
});

describe('pricing', () => {
  it('formats prices in the local currency', () => {
    expect(formatPrice(1433, 'INR', 'en-IN')).toBe('₹1,433');
    expect(formatPrice(21.6, 'USD', 'en-US')).toBe('$21.60');
    expect(formatPrice(199, 'INR', 'en-IN')).toBe('₹199');
    expect(formatPrice(9, 'USD', 'en-US')).toBe('$9');
  });
});

describe('unit formatting in right-to-left languages', () => {
  it('isolates the amount so the unit stays after the number', async () => {
    const { formatVolumePref, formatWeightPref } = await import('../units');
    expect(formatVolumePref(250, 'ml', 'en')).toBe('250 ml');
    expect(formatVolumePref(250, 'ml', 'ar')).toMatch(/^⁦.* ml⁩$/);
    expect(formatWeightPref(70, 'kg', 'ar').startsWith('⁦')).toBe(true);
  });
});
