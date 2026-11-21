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
  supportPhone: z.string().max(30).nullable().default(null),
  social: z.object({ instagram: z.string().url().nullable().default(null), youtube: z.string().url().nullable().default(null), x: z.string().url().nullable().default(null), facebook: z.string().url().nullable().default(null) }).default({ instagram: null, youtube: null, x: null, facebook: null }),
  /** Maintenance mode: members see a notice instead of the app (staff can still open /admin). */
  maintenance: z.object({ enabled: z.boolean().default(false), message: z.record(z.string(), z.string().max(300)).default({}) }).default({ enabled: false, message: {} }),
  /** Native apps older than this (semver) must update before continuing. Null = no minimum. */
  minAppVersion: z.string().regex(/^\d+\.\d+\.\d+$/).nullable().default(null),
});
export type AppSettings = z.infer<typeof AppSettings>;
export const DEFAULT_APP_SETTINGS: AppSettings = AppSettings.parse({});

/** Features the admin can switch off. Off hides the entry point; data is never deleted. */
export const FEATURE_KEYS = ['photoScan', 'aiEstimate', 'coach', 'planner', 'store', 'testimonials', 'deviceSync', 'reminders', 'upgradePrompt', 'cloudWearables', 'routeTracking', 'contact', 'diagnostics'] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];
/** Switched off until the admin turns them on (cloud watches need the Open Wearables backend, not deployed). */
const OFF_BY_DEFAULT: FeatureKey[] = ['cloudWearables'];
export const FeatureFlags = z.object(Object.fromEntries(FEATURE_KEYS.map((k) => [k, z.boolean().default(!OFF_BY_DEFAULT.includes(k))])) as Record<FeatureKey, z.ZodDefault<z.ZodBoolean>>);
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
  imageUrl: z.string().url().max(600).nullable().default(null),
  startsAt: z.string().datetime({ offset: true }).nullable().default(null),
  endsAt: z.string().datetime({ offset: true }).nullable().default(null),
  countries: z.array(z.string().regex(/^[A-Z]{2}$/)).default([]),
});
export type Banner = z.infer<typeof Banner>;
/** Home screen sections the admin can reorder or hide. */
export const HOME_SECTIONS = ['access', 'banners', 'announcements', 'summary', 'calories', 'macros', 'water', 'steps', 'workouts', 'coach', 'stories'] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];

/** Promotional ribbon across the top of the app (one at a time; the newest active one wins). */
export const Ribbon = z.object({
  id: z.string().min(1).max(40),
  active: z.boolean(),
  text: z.record(z.string(), z.string().max(120)),
  linkUrl: z.string().max(200).nullable().default(null),
  startsAt: z.string().datetime({ offset: true }).nullable().default(null),
  endsAt: z.string().datetime({ offset: true }).nullable().default(null),
  countries: z.array(z.string().regex(/^[A-Z]{2}$/)).default([]),
});
export type Ribbon = z.infer<typeof Ribbon>;

/** Onboarding welcome slides (shown before sign-up). */
export const OnboardingSlide = z.object({
  id: z.string().min(1).max(40),
  title: z.record(z.string(), z.string().max(80)),
  body: z.record(z.string(), z.string().max(240)),
  imageUrl: z.string().url().max(600).nullable().default(null),
});

export const ContentConfig = z.object({
  tagline: z.record(z.string(), z.string().max(80)).default({}),
  banners: z.array(Banner).max(10).default([]),
  ribbons: z.array(Ribbon).max(10).default([]),
  homeSections: z.array(z.object({ id: z.enum(HOME_SECTIONS), visible: z.boolean() })).max(HOME_SECTIONS.length).default([]),
  onboarding: z.array(OnboardingSlide).max(6).default([]),
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

/** Text overrides for any screen (appConfig/strings): { [language]: { "i18n.key": "text" } }. */
export const StringOverrides = z.object({
  strings: z.record(z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/), z.record(z.string().regex(/^[A-Za-z0-9_.-]{1,120}$/), z.string().max(2000))).default({}),
});
export type StringOverrides = z.infer<typeof StringOverrides>;

/** Pages (pages/{slug}): FAQ, help, terms, privacy and blog / tips, published per language. */
export const PAGE_KINDS = ['faq', 'help', 'legal', 'blog'] as const;
export const PageDoc = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,60}$/),
  kind: z.enum(PAGE_KINDS),
  published: z.boolean().default(false),
  order: z.number().int().min(0).max(9999).default(0),
  title: z.record(z.string(), z.string().max(140)),
  body: z.record(z.string(), z.string().max(20000)),
  seoTitle: z.record(z.string(), z.string().max(70)).default({}),
  seoDescription: z.record(z.string(), z.string().max(160)).default({}),
  imageUrl: z.string().url().max(600).nullable().default(null),
});
export type PageDoc = z.infer<typeof PageDoc>;

/** In-app announcements (announcements/{id}): shown on Home to the targeted audience between the dates. */
export const Announcement = z.object({
  active: z.boolean().default(true),
  title: z.record(z.string(), z.string().max(80)),
  body: z.record(z.string(), z.string().max(400)),
  startsAt: z.string().datetime({ offset: true }).nullable().default(null),
  endsAt: z.string().datetime({ offset: true }).nullable().default(null),
  countries: z.array(z.string().regex(/^[A-Z]{2}$/)).default([]),
  plans: z.array(z.enum(['free', 'premium', 'pro'])).default([]),
});
export type Announcement = z.infer<typeof Announcement>;

/** Is a dated, country-targeted item live now for this viewer? */
export function liveFor(item: { active: boolean; startsAt?: string | null; endsAt?: string | null; countries?: string[] }, nowMs: number, country: string | null | undefined): boolean {
  if (!item.active) return false;
  if (item.startsAt && Date.parse(item.startsAt) > nowMs) return false;
  if (item.endsAt && Date.parse(item.endsAt) <= nowMs) return false;
  const cs = item.countries ?? [];
  return cs.length === 0 || (!!country && cs.includes(country.toUpperCase()));
}

/** "1.2.10" < "1.10.0" comparison for the force-update check. */
export function versionBelow(current: string, min: string | null): boolean {
  if (!min) return false;
  const a = current.split('.').map(Number);
  const b = min.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) < (b[i] ?? 0);
  return false;
}
