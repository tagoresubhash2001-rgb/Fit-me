import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { Cloud } from 'lucide-react';
import { Badge, Button, Skeleton, toast } from '../../components/ui';
import { functions } from '../../lib/firebase';
import { useFormat } from '../../lib/hooks';

const NAMES: Record<string, string> = { garmin: 'Garmin', oura: 'Oura', whoop: 'WHOOP', polar: 'Polar', suunto: 'Suunto', strava: 'Strava', google: 'Fitbit / Google Health', withings: 'Withings' };
interface Status {
  configured: boolean;
  providers: Array<{ id: string; connected: boolean; lastSyncAt?: number | null }>;
}
const call = <T,>(name: string, data: unknown = {}) => httpsCallable(functions(), name, { timeout: 60000 })(data).then((r) => r.data as T);

/** Watches and rings that sync through their own cloud (server side through Open Wearables). */
export function CloudWearables() {
  const { t } = useTranslation();
  const { dateTime } = useFormat();
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => {
    call<Status>('wearablesStatus')
      .then(setS)
      .catch(() => setS({ configured: false, providers: Object.keys(NAMES).map((id) => ({ id, connected: false })) }));
  }, []);
  useEffect(load, [load]);
  if (!s) return <Skeleton className="h-16" />;
  const run = async (id: string, action: 'connect' | 'disconnect' | 'sync') => {
    setBusy(`${id}-${action}`);
    try {
      if (action === 'connect') {
        const { url } = await call<{ url: string }>('wearablesConnect', { provider: id, returnUrl: `${window.location.origin}/settings#devices` });
        window.location.assign(url);
        return;
      }
      if (action === 'disconnect') await call('wearablesDisconnect', { provider: id });
      else {
        const r = await call<{ days: number }>('wearablesSync');
        toast(t('devices.synced', { days: r.days }), 'success');
      }
      load();
    } catch {
      toast(t('devices.failed'), 'error');
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="flex flex-col gap-2 rounded-input border border-line p-3" id="cloud-wearables">
      <div className="flex items-center gap-3">
        <Cloud className="h-5 w-5 shrink-0 text-primary-text" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-ink">{t('devices.cloudTitle')}</p>
          <p className="text-small text-muted">{s.configured ? t('devices.cloudBody') : t('devices.cloudSoon')}</p>
        </div>
      </div>
      <ul className="flex flex-col divide-y divide-line">
        {s.providers.map((p) => (
          <li key={p.id} className="flex min-h-12 flex-wrap items-center gap-2 py-2">
            <span className="min-w-0 flex-1 text-small text-ink">
              {NAMES[p.id] ?? p.id}
              {p.connected && p.lastSyncAt ? <span className="block text-caption text-muted">{t('devices.lastSync', { when: dateTime(p.lastSyncAt) })}</span> : null}
            </span>
            {!s.configured ? (
              <Badge>{t('devices.notAvailableYet')}</Badge>
            ) : p.connected ? (
              <>
                <Button size="sm" loading={busy === `${p.id}-sync`} onClick={() => void run(p.id, 'sync')}>
                  {t('devices.syncNow')}
                </Button>
                <Button size="sm" variant="ghost" loading={busy === `${p.id}-disconnect`} onClick={() => void run(p.id, 'disconnect')}>
                  {t('devices.disconnect')}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="secondary" loading={busy === `${p.id}-connect`} onClick={() => void run(p.id, 'connect')}>
                {t('devices.connectShort')}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
