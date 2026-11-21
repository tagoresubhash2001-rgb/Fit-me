import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Camera, Footprints, HeartPulse, ImageIcon, MapPin } from 'lucide-react';
import { Button, Sheet } from '../../components/ui';
import { openSystemSettings, permissionState, requestPermission, type PermissionKind, type PermissionState } from '../../data/permissions';

export const PERMISSION_ICONS: Record<PermissionKind, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  motion: Footprints,
  location: MapPin,
  camera: Camera,
  photos: ImageIcon,
  health: HeartPulse,
  notifications: Bell,
};

type Ask = (kind: PermissionKind) => Promise<PermissionState>;
const Ctx = createContext<Ask | null>(null);

/**
 * One calm, branded explanation before each system permission prompt. ask(kind) resolves with the final state:
 * granted already -> at once; can ask -> explanation, then the system prompt; blocked -> explanation with a button
 * to the system settings.
 */
export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<{ kind: PermissionKind; state: PermissionState } | null>(null);
  const [busy, setBusy] = useState(false);
  const resolver = useRef<((s: PermissionState) => void) | null>(null);

  const ask = useCallback<Ask>(async (kind) => {
    const state = await permissionState(kind);
    if (state === 'granted' || state === 'limited' || state === 'unsupported') return state;
    return new Promise((resolve) => {
      resolver.current = resolve;
      setOpen({ kind, state });
    });
  }, []);

  const finish = (s: PermissionState) => {
    resolver.current?.(s);
    resolver.current = null;
    setOpen(null);
  };

  const Icon = open ? PERMISSION_ICONS[open.kind] : Bell;
  const blocked = open?.state === 'blocked';
  return (
    <Ctx.Provider value={ask}>
      {children}
      <Sheet
        open={!!open}
        onClose={() => !busy && finish(open?.state ?? 'prompt')}
        closeLabel={t('common.close')}
        title={open ? t(`permissions.${open.kind}.title`) : ''}
        footer={
          <div className="flex gap-2">
            <Button
              id="permission-continue"
              fullWidth
              loading={busy}
              onClick={async () => {
                if (!open) return;
                if (blocked) {
                  await openSystemSettings();
                  return finish('blocked');
                }
                setBusy(true);
                const s = await requestPermission(open.kind).finally(() => setBusy(false));
                finish(s);
              }}
            >
              {blocked ? t('permissions.openSettings') : t('permissions.continue')}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => finish(open?.state ?? 'prompt')}>
              {t('permissions.notNow')}
            </Button>
          </div>
        }
      >
        {open && (
          <div className="flex flex-col items-center gap-3 text-center" id={`primer-${open.kind}`}>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-subtle text-primary-text">
              <Icon className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <p className="text-body text-ink">{t(`permissions.${open.kind}.why`)}</p>
            <p className="text-small text-muted">{t(blocked ? 'permissions.blockedBody' : 'permissions.privacy')}</p>
          </div>
        )}
      </Sheet>
    </Ctx.Provider>
  );
}

/** Ask for a permission with FitMe's explanation first. Falls back to the plain request outside the provider. */
export function useAskPermission(): Ask {
  return useContext(Ctx) ?? requestPermission;
}
