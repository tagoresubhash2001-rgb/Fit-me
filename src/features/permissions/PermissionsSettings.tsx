import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { Badge, Button, Card, CardHeader, Skeleton } from '../../components/ui';
import { openSystemSettings, permissionState, PERMISSIONS, type PermissionKind, type PermissionState } from '../../data/permissions';
import { isNative } from '../../lib/platform';
import { PERMISSION_ICONS, useAskPermission } from './PermissionPrimer';

/** Settings > Permissions: every permission, its state and a button to change it. */
export function PermissionsSettings() {
  const { t } = useTranslation();
  const ask = useAskPermission();
  const [states, setStates] = useState<Record<PermissionKind, PermissionState> | null>(null);
  const refresh = useCallback(() => {
    void Promise.all(PERMISSIONS.map(async (k) => [k, await permissionState(k)] as const)).then((e) => setStates(Object.fromEntries(e) as Record<PermissionKind, PermissionState>));
  }, []);
  useEffect(() => {
    refresh();
    const onFocus = () => refresh(); // back from the system settings
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [refresh]);
  return (
    <Card id="permissions" className="flex scroll-mt-24 flex-col gap-3">
      <CardHeader title={t('permissions.title')} icon={<ShieldCheck className="h-5 w-5" strokeWidth={1.75} />} />
      {!states ? (
        <Skeleton className="h-40" />
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {PERMISSIONS.map((k) => {
            const s = states[k];
            const Icon = PERMISSION_ICONS[k];
            return (
              <li key={k} className="flex min-h-14 items-center gap-3 py-2" id={`perm-${k}`}>
                <Icon className="h-5 w-5 shrink-0 text-muted" strokeWidth={1.75} />
                <span className="min-w-0 flex-1">
                  <span className="block text-body text-ink">{t(`permissions.${k}.title`)}</span>
                  <span className="block text-caption text-muted">{t(`permissions.${k}.short`)}</span>
                </span>
                <Badge tone={s === 'granted' || s === 'limited' ? 'primary' : s === 'blocked' ? 'accent' : 'neutral'}>{t(`permissions.state.${s}`)}</Badge>
                {s === 'prompt' || s === 'denied' ? (
                  <Button size="sm" variant="secondary" onClick={() => void ask(k).then(refresh)}>
                    {t('permissions.allow')}
                  </Button>
                ) : (s === 'blocked' || s === 'granted' || s === 'limited') && isNative() ? (
                  <Button size="sm" variant="ghost" onClick={() => void openSystemSettings()}>
                    {t('permissions.change')}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {!isNative() && <p className="text-caption text-muted">{t('permissions.webNote')}</p>}
    </Card>
  );
}
