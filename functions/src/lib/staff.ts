import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './admin';
import { requireAuth } from './callable';
import { ADMIN_ROLES, canOpen, isAdminRole, type AdminRole, type AdminSection } from './adminRoles';

/**
 * Staff roles live in Firebase Auth custom claims (`role`), set only by Cloud Functions (or the one-time
 * bootstrap script). Every admin action checks them here and again in Security Rules.
 */
export const ROLES = ADMIN_ROLES;
export type Role = AdminRole;

export function roleOf(token: Record<string, unknown> | undefined): Role | null {
  const r = token?.role;
  return isAdminRole(r) ? r : null;
}

export type Actor = { uid: string; role: Role; email: string | null };

/** Throws unless the caller is signed in with a role that may open `section` (matrix in lib/adminRoles.ts). */
export async function requireSection(req: CallableRequest<unknown>, section: AdminSection): Promise<Actor> {
  const uid = await requireAuth(req);
  const role = roleOf(req.auth?.token as Record<string, unknown>);
  if (!canOpen(role, section)) throw new HttpsError('permission-denied', 'staff_only', { section });
  return { uid, role: role!, email: (req.auth?.token.email as string | undefined) ?? null };
}

/** Any staff role (for actions on the caller's own staff session). */
export async function requireAnyStaff(req: CallableRequest<unknown>): Promise<Actor> {
  return requireSection(req, 'overview');
}

/**
 * Immutable activity log (adminLogs): who, what, when, and before/after values. Server-write only; no update or
 * delete rule exists, so entries cannot be changed from any client.
 */
export async function logAdmin(
  actor: { uid: string; role: Role; email: string | null },
  action: string,
  target: { type: string; id: string },
  before: unknown,
  after: unknown,
  note?: string,
): Promise<void> {
  const clean = (v: unknown) => (v === undefined ? null : JSON.parse(JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && 'toMillis' in x ? (x as { toMillis(): number }).toMillis() : x))));
  await db()
    .collection('adminLogs')
    .add({ actorUid: actor.uid, actorRole: actor.role, actorEmail: actor.email, action, targetType: target.type, targetId: target.id, before: clean(before), after: clean(after), note: note ?? null, at: FieldValue.serverTimestamp() });
}
