/** Unit conversions for metric and imperial display (PRD section 4). Storage is always metric. */
export type UnitSystem = 'metric' | 'imperial';

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;
export const ML_PER_FLOZ = 29.5735295625;
export const KM_PER_MI = 1.609344;

export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const mlToFlOz = (ml: number) => ml / ML_PER_FLOZ;
export const flOzToMl = (oz: number) => oz * ML_PER_FLOZ;
export const kmToMi = (km: number) => km / KM_PER_MI;

export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalIn = Math.round(cm / CM_PER_IN);
  return { ft: Math.floor(totalIn / 12), inch: totalIn % 12 };
}
export const ftInToCm = (ft: number, inch: number) => (ft * 12 + inch) * CM_PER_IN;

export function formatWeight(kg: number, units: UnitSystem, locale: string): string {
  const v = units === 'imperial' ? kgToLb(kg) : kg;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(v)} ${units === 'imperial' ? 'lb' : 'kg'}`;
}
export function formatVolume(ml: number, units: UnitSystem, locale: string): string {
  if (units === 'imperial') return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(mlToFlOz(ml))} fl oz`;
  if (ml >= 1000) return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(ml / 1000)} L`;
  return `${new Intl.NumberFormat(locale).format(Math.round(ml))} ml`;
}

// ---- Unit choices (PRD section 4, owner correction 2) ----
export type HeightUnit = 'cm' | 'ftin';
export type WeightUnit = 'kg' | 'lb' | 'stlb';
export type VolumeUnit = 'ml' | 'l' | 'floz' | 'cup';

export const LB_PER_ST = 14;
export const ML_PER_CUP = 240; // US customary cup used for drinks

export function kgToStLb(kg: number): { st: number; lb: number } {
  const totalLb = kgToLb(kg);
  let st = Math.floor(totalLb / LB_PER_ST);
  let lb = Math.round((totalLb - st * LB_PER_ST) * 10) / 10;
  if (lb >= LB_PER_ST) {
    st += 1;
    lb = 0;
  }
  return { st, lb };
}
export const stLbToKg = (st: number, lb: number) => lbToKg(st * LB_PER_ST + lb);

export function volumeToMl(value: number, unit: VolumeUnit): number {
  switch (unit) {
    case 'l':
      return value * 1000;
    case 'floz':
      return flOzToMl(value);
    case 'cup':
      return value * ML_PER_CUP;
    default:
      return value;
  }
}
export function mlToVolume(ml: number, unit: VolumeUnit): number {
  switch (unit) {
    case 'l':
      return ml / 1000;
    case 'floz':
      return mlToFlOz(ml);
    case 'cup':
      return ml / ML_PER_CUP;
    default:
      return ml;
  }
}

export interface UnitPrefs {
  height: HeightUnit;
  weight: WeightUnit;
  volume: VolumeUnit;
}

/** Default unit choices by country: US ft/in + lb + fl oz; UK ft/in + st/lb + ml; everyone else metric. */
export function defaultUnitPrefs(country: string): UnitPrefs {
  if (['US', 'LR', 'MM'].includes(country)) return { height: 'ftin', weight: 'lb', volume: 'floz' };
  if (country === 'GB') return { height: 'ftin', weight: 'stlb', volume: 'ml' };
  return { height: 'cm', weight: 'kg', volume: 'ml' };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function formatHeightPref(cm: number, unit: HeightUnit): string {
  if (unit === 'ftin') {
    const { ft, inch } = cmToFtIn(cm);
    return `${ft} ft ${inch} in`;
  }
  return `${Math.round(cm)} cm`;
}

export function formatWeightPref(kg: number, unit: WeightUnit, locale = 'en'): string {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  if (unit === 'lb') return `${nf.format(r1(kgToLb(kg)))} lb`;
  if (unit === 'stlb') {
    const { st, lb } = kgToStLb(kg);
    return `${st} st ${nf.format(lb)} lb`;
  }
  return `${nf.format(r1(kg))} kg`;
}

export function formatVolumePref(ml: number, unit: VolumeUnit, locale = 'en'): string {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: unit === 'ml' ? 0 : unit === 'l' ? 2 : 1 });
  const label = { ml: 'ml', l: 'L', floz: 'fl oz', cup: 'cups' }[unit];
  return `${nf.format(mlToVolume(ml, unit))} ${label}`;
}
