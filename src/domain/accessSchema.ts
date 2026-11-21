import { z } from 'zod';
import type { AccessConfig as AccessConfigShape } from './access';

/** Validation for appConfig/access (rules in access.ts). functions/src/lib/accessSchema.ts is an exact copy. */
export const AccessConfig = z.object({
  /** Bumped by the admin dashboard on every change; stored on each user's access record. */
  version: z.number().int().min(1),
  welcomeDays: z.number().int().min(0).max(90),
  trialDays: z.number().int().min(0).max(365),
  welcomePlan: z.enum(['premium', 'pro']),
  trialPlan: z.enum(['premium', 'pro']),
});
export type AccessConfigParsed = z.infer<typeof AccessConfig>;
// Compile-time check that the schema and the interface agree.
export const _accessShapeCheck = (x: AccessConfigParsed): AccessConfigShape => x;
