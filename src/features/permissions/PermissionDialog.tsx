import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Camera, Footprints, HeartPulse, ImageIcon, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { openSystemSettings, requestPermission, type PermissionKind, type PermissionState } from '../../data/permissions';

export const PERMISSION_ICONS: Record<PermissionKind, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  motion: Footprints,
  location: MapPin,
  camera: Camera,
  photos: ImageIcon,
  health: HeartPulse,
  notifications: Bell,
};

/** The explanation sheet itself (loaded the first time a permission is asked for). */
export default function PermissionDialog({ open, finish }: { open: { kind: PermissionKind; state: PermissionState } | null; finish: (s: PermissionState) => void }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const Icon = open ? PERMISSION_ICONS[open.kind] : Bell;
  const blocked = open?.state === 'blocked';
  return (
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
  );
}
