import { z } from 'zod';

/**
 * Admin-managed configuration documents in Firestore `appConfig/*` (server-write only, edited from the admin
 * dashboard through Cloud Functions). Shared defaults keep the app working until a document exists.
 */

/** appConfig/app: store links and support details. Links are shown only once set (no dead buttons). */
export const AppSettings = z.object({
  androidUrl: z.string().url().nullable().default(null),
  iosUrl: z.string().url().nullable().default(null),
  supportEmail: z.string().email().nullable().default(null),
  privacyUrl: z.string().url().nullable().default(null),
  termsUrl: z.string().url().nullable().default(null),
});
export type AppSettings = z.infer<typeof AppSettings>;
export const DEFAULT_APP_SETTINGS: AppSettings = AppSettings.parse({});

/** Features the admin can switch off. Off hides the entry point; data is never deleted. */
export const FEATURE_KEYS = ['photoScan', 'aiEstimate', 'coach', 'planner', 'store', 'testimonials', 'deviceSync', 'reminders', 'upgradePrompt'] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];
export const FeatureFlags = z.object(Object.fromEntries(FEATURE_KEYS.map((k) => [k, z.boolean().default(true)])) as Record<FeatureKey, z.ZodDefault<z.ZodBoolean>>);
export type FeatureFlags = Record<FeatureKey, boolean>;
export const DEFAULT_FEATURES: FeatureFlags = FeatureFlags.parse({}) as FeatureFlags;

/** appConfig/content: editable copy and banners (per language; English is the fallback). */
export const Banner = z.object({
  id: z.string().min(1).max(40),
  active: z.boolean(),
  title: z.record(z.string(), z.string().max(80)),
  body: z.record(z.string(), z.string().max(240)),
  linkUrl: z.string().max(200).nullable().default(null),
  linkLabel: z.record(z.string(), z.string().max(40)).default({}),
  endsAt: z.string().datetime({ offset: true }).nullable().default(null),
});
export type Banner = z.infer<typeof Banner>;
export const ContentConfig = z.object({
  tagline: z.record(z.string(), z.string().max(80)).default({}),
  banners: z.array(Banner).max(10).default([]),
  testimonialsTitle: z.record(z.string(), z.string().max(80)).default({}),
  testimonialsVisible: z.boolean().default(true),
});
export type ContentConfig = z.infer<typeof ContentConfig>;
export const DEFAULT_CONTENT: ContentConfig = ContentConfig.parse({});

/** appConfig/plans: display copy for each paid tier and whether it is offered to new subscribers. */
export const PlanCatalog = z.object({
  plans: z
    .array(
      z.object({
        id: z.enum(['premium', 'pro']),
        active: z.boolean().default(true),
        name: z.record(z.string(), z.string().max(40)).default({}),
        description: z.record(z.string(), z.string().max(200)).default({}),
        benefits: z.record(z.string(), z.array(z.string().max(80)).max(10)).default({}),
      }),
    )
    .default([]),
});
export type PlanCatalog = z.infer<typeof PlanCatalog>;
export const DEFAULT_PLAN_CATALOG: PlanCatalog = { plans: [] };

/** Picks the user's language, else English, else the first value. */
export function localized(map: Record<string, string> | undefined, lang: string): string | undefined {
  if (!map) return undefined;
  return map[lang] ?? map[lang.split('-')[0]] ?? map.en ?? Object.values(map)[0];
}
