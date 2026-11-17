import { useTranslation } from 'react-i18next';
import { useSession } from '../../data/session';
import { unitPrefsOf } from '../../domain/prefs';
import { formatHeightPref, formatVolumePref, formatWeightPref, defaultUnitPrefs, type UnitPrefs } from '../../domain/units';

/** The signed-in user's unit choices and formatters (always given metric values). */
export function useUnits() {
  const { i18n } = useTranslation();
  const profile = useSession((s) => s.profile);
  const prefs: UnitPrefs = profile ? unitPrefsOf(profile) : defaultUnitPrefs('IN');
  const lang = i18n.language;
  return {
    prefs,
    vol: (ml: number) => formatVolumePref(ml, prefs.volume, lang),
    wt: (kg: number) => formatWeightPref(kg, prefs.weight, lang),
    ht: (cm: number) => formatHeightPref(cm, prefs.height),
  };
}
