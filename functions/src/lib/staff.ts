import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './admin';
import { requireAuth } from './callable';

/**
 * Staff roles live in Firebase Auth custom claims (`role`), set only by Cloud Functions (or the one-time
 * bootstrap script). Every admin action checks them here and again in Security Rules.
 */
export const ROLES = ['superAdmin', 'admin', 'moderator'] as const;
export type Role = (typeof ROLES)[number];
const RANK: Record<Role, number> = { moderator: 1, admin: 2, superAdmin: 3 };

export function roleOf(token: Record<string, unknown> | undefined): Role | null {
  const r = token?.role;
  return typeof r === 'string' && (ROLES as readonly string[]).includes(r) ? (r as Role) : null;
}

export function roleAtLeast(role: Role | null, min: Role): boolean {
  return !!role && RANK[role] >= RANK[min];
}

/** Throws unless the caller is signed in with at least `min`. Returns the caller's uid and role. */
export async function requireStaff(req: CallableRequest<unknown>, min: Role): Promise<{ uid: string; role: Role; email: string | null }> {
  const uid = await requireAuth(req);
  const role = roleOf(req.auth?.token as Record<string, unknown>);
  if (!roleAtLeast(role, min)) throw new HttpsError('permission-denied', 'staff_only', { required: min });
  return { uid, role: role!, email: (req.auth?.token.email as string | undefined) ?? null };
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
