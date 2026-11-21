/**
 * Admin roles and the sections each one may open. Shared by the admin app (what to show) and Cloud Functions
 * (what to allow): functions/src/lib/adminRoles.ts is an exact copy (test: config-mirror). Security Rules repeat
 * the same matrix for the collections staff can read directly.
 */
export const ADMIN_ROLES = ['superAdmin', 'admin', 'finance', 'content', 'support', 'moderator'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_SECTIONS = [
  'overview',
  'users',
  'finance',
  'plans',
  'trials',
  'coupons',
  'content',
  'foods',
  'testimonials',
  'notifications',
  'features',
  'settings',
  'integrations',
  'support',
  'admins',
  'logs',
] as const;
export type AdminSection = (typeof ADMIN_SECTIONS)[number];

const ALL = ADMIN_SECTIONS as readonly AdminSection[];
/** moderator is the earlier name of support (kept so existing claims keep working). */
const SUPPORT: AdminSection[] = ['overview', 'users', 'testimonials', 'support', 'foods'];
export const ROLE_SECTIONS: Record<AdminRole, readonly AdminSection[]> = {
  superAdmin: ALL,
  admin: ALL.filter((s) => s !== 'admins' && s !== 'integrations'),
  finance: ['overview', 'finance', 'plans', 'trials', 'coupons', 'logs'],
  content: ['overview', 'content', 'foods', 'testimonials', 'notifications'],
  support: SUPPORT,
  moderator: SUPPORT,
};

export function isAdminRole(r: unknown): r is AdminRole {
  return typeof r === 'string' && (ADMIN_ROLES as readonly string[]).includes(r);
}

export function canOpen(role: AdminRole | null | undefined, section: AdminSection): boolean {
  return !!role && ROLE_SECTIONS[role].includes(section);
}

/** Roles a super admin can hand out from the dashboard (moderator is legacy, not offered). */
export const ASSIGNABLE_ROLES: AdminRole[] = ['superAdmin', 'admin', 'finance', 'content', 'support'];
