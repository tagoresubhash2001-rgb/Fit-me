import { useEffect, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../../lib/firebase';

export type Role = 'superAdmin' | 'admin' | 'moderator';
const RANK: Record<Role, number> = { moderator: 1, admin: 2, superAdmin: 3 };
export const atLeast = (role: Role | null, min: Role) => !!role && RANK[role] >= RANK[min];

/** Calls an admin Cloud Function (all checks happen on the server). */
export async function call<T>(name: string, data: unknown = {}): Promise<T> {
  return (await httpsCallable(functions(), name, { timeout: 120000 })(data)).data as T;
}

/** Stable error code from a callable error (e.g. "permission-denied: staff_only"). */
export function errorCode(e: unknown): string {
  const code = String((e as { code?: string })?.code ?? '').replace('functions/', '');
  const msg = String((e as { message?: string })?.message ?? '');
  return msg && code ? `${code}: ${msg}` : code || msg || 'unknown';
}

/** The signed-in user's staff role from their ID token claims (refreshed so a new role shows at once). */
export function useStaffRole(): { loading: boolean; role: Role | null; email: string | null; uid: string | null } {
  const [state, setState] = useState<{ loading: boolean; role: Role | null; email: string | null; uid: string | null }>({ loading: true, role: null, email: null, uid: null });
  useEffect(() => {
    return onIdTokenChanged(auth(), async (u) => {
        if (!u) return setState({ loading: false, role: null, email: null, uid: null });
        try {
          const r = await u.getIdTokenResult(true);
          const role = r.claims.role;
          setState({ loading: false, role: role === 'superAdmin' || role === 'admin' || role === 'moderator' ? role : null, email: u.email, uid: u.uid });
        } catch {
          setState({ loading: false, role: null, email: u.email, uid: u.uid });
        }
      });
  }, []);
  return state;
}

export const fmtDate = (ms: number | null | undefined, lang: string) =>
  ms ? new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ms)) : '—';
