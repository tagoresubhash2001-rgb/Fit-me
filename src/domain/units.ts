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
