import React, { Suspense, createContext, lazy, useCallback, useContext, useRef, useState } from 'react';
import type { PermissionKind, PermissionState } from '../../data/permissions';

const PermissionDialog = lazy(() => import('./PermissionDialog'));

type Ask = (kind: PermissionKind) => Promise<PermissionState>;
const Ctx = createContext<Ask | null>(null);

/**
 * One calm, branded explanation before each system permission prompt. ask(kind) resolves with the final state:
 * granted already -> at once; can ask -> explanation, then the system prompt; blocked -> explanation with a button
 * to the system settings. The sheet and the permission code load on first use (not at app start).
 */
export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<{ kind: PermissionKind; state: PermissionState } | null>(null);
  const [used, setUsed] = useState(false);
  const resolver = useRef<((s: PermissionState) => void) | null>(null);

  const ask = useCallback<Ask>(async (kind) => {
    const { permissionState } = await import('../../data/permissions');
    const state = await permissionState(kind);
    if (state === 'granted' || state === 'limited' || state === 'unsupported') return state;
    return new Promise((resolve) => {
      resolver.current = resolve;
      setUsed(true);
      setOpen({ kind, state });
    });
  }, []);

  const finish = useCallback((s: PermissionState) => {
    resolver.current?.(s);
    resolver.current = null;
    setOpen(null);
  }, []);

  return (
    <Ctx.Provider value={ask}>
      {children}
      {used && (
        <Suspense fallback={null}>
          <PermissionDialog open={open} finish={finish} />
        </Suspense>
      )}
    </Ctx.Provider>
  );
}

/** Ask for a permission with FitMe's explanation first. Falls back to the plain request outside the provider. */
export function useAskPermission(): Ask {
  const ctx = useContext(Ctx);
  return ctx ?? (async (kind) => (await import('../../data/permissions')).requestPermission(kind));
}
