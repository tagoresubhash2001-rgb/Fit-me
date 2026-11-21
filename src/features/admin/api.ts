import { useEffect, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../../lib/firebase';
import { canOpen, isAdminRole, type AdminRole, type AdminSection } from '../../domain/adminRoles';

export type Role = AdminRole;
export { canOpen };
export type { AdminSection };

/** Calls an admin Cloud Function (all checks happen on the server). */
export async function call<T>(name: string, data: unknown = {}): Promise<T> {
  return (await httpsCallable(functions(), name, { timeout: 120000 })(data)).data as T;
}

/** One action of the multiplexed admin function (functions/src/admin/control.ts). */
export const act = <T,>(action: string, data: unknown = {}) => call<T>('adminAction', { action, data });

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
        setState({ loading: false, role: isAdminRole(r.claims.role) ? r.claims.role : null, email: u.email, uid: u.uid });
      } catch {
        setState({ loading: false, role: null, email: u.email, uid: u.uid });
      }
    });
  }, []);
  return state;
}

export const fmtDate = (ms: number | null | undefined, lang: string) =>
  ms ? new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ms)) : '—';

/** Downloads rows as a CSV file (quotes every cell; formulas are neutralised for spreadsheet safety). */
export function downloadCsv(name: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return;
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [cols.map(cell).join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `${name}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Small hook: runs an admin action on mount and when deps change. */
export function useAction<T>(action: string, data: unknown, deps: unknown[] = []) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    act<T>(action, data)
      .then((d) => {
        if (live) setState({ data: d, error: null, loading: false });
      })
      .catch((e) => {
        if (live) setState({ data: null, error: errorCode(e), loading: false });
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, tick, ...deps]);
  return { ...state, reload: () => setTick((x) => x + 1) };
}
