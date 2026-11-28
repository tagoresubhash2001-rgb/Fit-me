import i18n from 'i18next';
import siteEn from '../../locales/site.en.json';

/** Website copy (site.*) loads with the website chunk only, so the member app's first paint stays small. */
if (!i18n.exists('site.brand')) i18n.addResourceBundle('en', 'translation', siteEn, true, false);

/** Arrays and objects from the site copy (t() with returnObjects), typed. */
export function list<T>(t: (k: string, o: { returnObjects: true }) => unknown, key: string): T[] {
  const v = t(key, { returnObjects: true });
  return Array.isArray(v) ? (v as T[]) : [];
}
