import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Footprints } from 'lucide-react';
import { Badge, Button, toast } from '../../components/ui';
import { disablePhoneSteps, enablePhoneSteps, phoneStepsStatus, syncPhoneSteps, type PhoneStepsStatus } from '../../data/steps';
import { useAskPermission } from '../permissions/PermissionPrimer';
import { useFormat } from '../../lib/hooks';

/** "This phone" step counter (works without a watch). Native only; the web card explains where it works. */
export function OnDeviceSteps() {
  const { t } = useTranslation();
  const { dateTime } = useFormat();
  const ask = useAskPermission();
  const [s, setS] = useState<PhoneStepsStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(() => void phoneStepsStatus().then(setS).catch(() => setS(null)), []);
  useEffect(refresh, [refresh]);
  if (!s || !s.supported) return null;
  return (
    <div className="flex flex-col gap-2 rounded-input border border-line p-3" id="phone-steps">
      <div className="flex items-center gap-3">
        <Footprints className="h-5 w-5 shrink-0 text-primary-text" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-ink">{t('steps.phoneTitle')}</p>
          <p className="text-small text-muted">{s.enabled ? (s.lastSyncAt ? t('devices.lastSync', { when: dateTime(s.lastSyncAt) }) : t('devices.notSyncedYet')) : t('steps.phoneBody')}</p>
        </div>
        <Badge tone={s.enabled ? 'primary' : 'neutral'}>{s.enabled ? t('devices.connected') : t('devices.off')}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {s.enabled ? (
          <>
            <Button
              size="sm"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await syncPhoneSteps(7);
                  toast(t('steps.synced'), 'success');
                } catch {
                  toast(t('devices.failed'), 'error');
                } finally {
                  setBusy(false);
                  refresh();
                }
              }}
            >
              {t('devices.syncNow')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void disablePhoneSteps().then(refresh)}>
              {t('steps.phoneOff')}
            </Button>
          </>
        ) : (
          <Button
            id="phone-steps-on"
            size="sm"
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await ask('motion');
                // Already allowed earlier: start counting now (the request path starts it itself).
                if (r === 'granted') await enablePhoneSteps();
                else toast(t('steps.permissionDenied'), 'error');
              } finally {
                setBusy(false);
                refresh();
              }
            }}
          >
            {t('steps.phoneOn')}
          </Button>
        )}
      </div>
    </div>
  );
}
