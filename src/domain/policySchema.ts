import { z } from 'zod';
import { GATED_FEATURES, type GatedFeature } from './policy';

/**
 * Schema of appConfig/policy (see policy.ts for the rules). Shared by the app and Cloud Functions:
 * functions/src/lib/policySchema.ts is an exact copy (test: config-mirror).
 */
const Country = z.string().regex(/^[A-Z]{2}$/);

export const FeatureOverride = z.object({
  feature: z.enum(GATED_FEATURES as [GatedFeature, ...GatedFeature[]]),
  tier: z.enum(['free', 'premium', 'pro']),
  /** Empty = every country. */
  countries: z.array(Country).max(250).default([]),
});
export type FeatureOverride = z.infer<typeof FeatureOverride>;

export const AccessPolicy = z.object({
  version: z.number().int().min(1).default(1),
  freeLaunch: z
    .object({
      enabled: z.boolean().default(false),
      /** Empty = every country. */
      countries: z.array(Country).max(250).default([]),
    })
    .default({ enabled: false, countries: [] }),
  overrides: z.array(FeatureOverride).max(200).default([]),
  /** Welcome Unlock / trial days for new sign-ups per country (missing = the global appConfig/access values). */
  stageDays: z.record(Country, z.object({ welcomeDays: z.number().int().min(0).max(90), trialDays: z.number().int().min(0).max(365) })).default({}),
});
export type AccessPolicy = z.infer<typeof AccessPolicy>;
export const DEFAULT_POLICY: AccessPolicy = AccessPolicy.parse({});


