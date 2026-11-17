import type { UserProfile } from './models';
import { defaultUnitPrefs, type UnitPrefs } from './units';

/** The user's unit choices, falling back to the country defaults and then the old metric/imperial flag. */
export function unitPrefsOf(p: Pick<UserProfile, 'country' | 'units' | 'heightUnit' | 'weightUnit' | 'volumeUnit'>): UnitPrefs {
  const d = defaultUnitPrefs(p.country);
  const legacy = p.units === 'imperial' ? { height: 'ftin' as const, weight: 'lb' as const, volume: 'floz' as const } : null;
  return {
    height: p.heightUnit ?? legacy?.height ?? d.height,
    weight: p.weightUnit ?? legacy?.weight ?? d.weight,
    volume: p.volumeUnit ?? legacy?.volume ?? d.volume,
  };
}
