import { useEffect } from 'react';
import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import type { z } from 'zod';
import { db } from '../lib/firebase';
import { AppSettings, ContentConfig, DEFAULT_APP_SETTINGS, DEFAULT_CONTENT, DEFAULT_FEATURES, DEFAULT_PLAN_CATALOG, FeatureFlags, PlanCatalog, StringOverrides } from '../domain/appConfig';

/**
 * Live, admin-managed config (appConfig/app, appConfig/features, appConfig/content). One listener per document
 * for the whole app; defaults apply until it loads or if it is missing or invalid.
 */
type Store = { values: Record<string, unknown>; started: Set<string> };
const useStore = create<Store>(() => ({ values: {}, started: new Set() }));

function useConfigDoc<T>(id: string, schema: z.ZodType<T>, fallback: T): T {
  useEffect(() => {
    const s = useStore.getState();
    if (s.started.has(id)) return;
    s.started.add(id);
    // App-lifetime listener (config is tiny). On an error (e.g. signed out) it ends, and the next screen
    // that needs the document subscribes again.
    onSnapshot(
      doc(db(), `appConfig/${id}`),
      (snap) => {
        const parsed = snap.exists() ? schema.safeParse(snap.data()) : null;
        useStore.setState((st) => ({ values: { ...st.values, [id]: parsed?.success ? parsed.data : fallback } }));
      },
      () => useStore.getState().started.delete(id),
    );
  }, [id, schema, fallback]);
  return useStore((s) => (s.values[id] as T | undefined) ?? fallback);
}

export const useAppSettings = () => useConfigDoc('app', AppSettings, DEFAULT_APP_SETTINGS);
export const useFeatures = () => useConfigDoc('features', FeatureFlags as unknown as z.ZodType<typeof DEFAULT_FEATURES>, DEFAULT_FEATURES);
export const useContent = () => useConfigDoc('content', ContentConfig, DEFAULT_CONTENT);
export const usePlanCatalog = () => useConfigDoc('plans', PlanCatalog, DEFAULT_PLAN_CATALOG);

export const useStringOverrides = () => useConfigDoc('strings', StringOverrides, { strings: {} });

/** Applies the admin's text overrides to i18next (every screen, every language) as soon as they change. */
export function useApplyStringOverrides() {
  const o = useStringOverrides();
  useEffect(() => {
    void import('../lib/i18n').then(({ default: i18n }) => {
      for (const [lang, map] of Object.entries(o.strings)) {
        const nested: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(map)) {
          const parts = key.split('.');
          let node = nested;
          for (const p of parts.slice(0, -1)) node = (node[p] ??= {}) as Record<string, unknown>;
          node[parts[parts.length - 1]] = value;
        }
        i18n.addResourceBundle(lang, 'translation', nested, true, true);
      }
      // Re-render with the new texts.
      void i18n.changeLanguage(i18n.language);
    });
  }, [o]);
}
