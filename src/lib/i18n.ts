import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { detectDeviceLocale, isRtl, SUPPORTED_LANGUAGES, type Language } from '../domain/locale';
import en from '../locales/en.json';

/** Other languages load on demand so the first paint only ships English plus the active language. */
const loaders: Record<Exclude<Language, 'en'>, () => Promise<{ default: Record<string, unknown> }>> = {
  hi: () => import('../locales/hi.json'),
  te: () => import('../locales/te.json'),
  ta: () => import('../locales/ta.json'),
  es: () => import('../locales/es.json'),
  pt: () => import('../locales/pt.json'),
  fr: () => import('../locales/fr.json'),
  de: () => import('../locales/de.json'),
  ar: () => import('../locales/ar.json'),
  id: () => import('../locales/id.json'),
};

const STORAGE_KEY = 'fit_me_language';

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) return saved as Language;
  } catch {
    /* ignore */
  }
  return detectDeviceLocale().language;
}

function applyDocumentLanguage(lang: string) {
  document.documentElement.lang = lang;
  document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
}

export async function setLanguage(lang: Language) {
  if (lang !== 'en' && !i18n.hasResourceBundle(lang, 'translation')) {
    const mod = await loaders[lang]();
    i18n.addResourceBundle(lang, 'translation', mod.default, true, true);
  }
  await i18n.changeLanguage(lang);
  applyDocumentLanguage(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

export async function initI18n() {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  await setLanguage(initialLanguage());
  return i18n;
}

export default i18n;
