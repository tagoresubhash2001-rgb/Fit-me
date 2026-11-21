import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, RefreshCw, Smartphone, Watch, X } from 'lucide-react';
import { Badge, Button, Card, CardHeader, Skeleton, toast } from '../../components/ui';
import { OnDeviceSteps } from './OnDeviceSteps';
import { CloudWearables } from './CloudWearables';
import { useAskPermission } from '../permissions/PermissionPrimer';
import { disconnectHealth, healthAppName, healthStatus, HEALTH_TYPES, openHealthSettings, syncHealth, type HealthStatus } from '../../data/healthSync';
import { useAppSettings, useFeatures } from '../../data/appConfig';
import { useFormat } from '../../lib/hooks';

/**
 * Connected devices (Settings): Apple Health on iOS (Apple Watch and apps that write to Health) and Health
 * Connect on Android (Wear OS, Samsung Health, Fitbit and more). On the web there is nothing to connect, so the
 * screen says so and points to the mobile app instead of showing a button that cannot work.
 */
export function ConnectedDevices() {
  const { t } = useTranslation();
  const { dateTime } = useFormat();
  const app = useAppSettings();
  const features = useFeatures();
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [busy, setBusy] = useState<'connect' | 'sync' | 'disconnect' | null>(null);
  const name = t(`devices.${healthAppName()}`);
  const ask = useAskPermission();

  const refresh = useCallback(() => {
    void healthStatus()
      .then(setStatus)
      .catch(() => setStatus({ availability: 'missing', connected: false, granted: [], denied: [], lastSyncAt: null }));
  }, []);
  useEffect(refresh, [refresh]);

  const run = async (kind: 'connect' | 'sync' | 'disconnect') => {
    setBusy(kind);
    try {
      if (kind === 'connect') {
        const p = await ask('health');
        const r = p === 'granted' || p === 'limited' ? 'granted' : p === 'unsupported' ? 'unavailable' : 'denied';
        if (r !== 'granted') toast(t(r === 'denied' ? 'devices.denied' : 'devices.unavailable', { app: name }), 'error');
        else {
          const c = await syncHealth(7);
          toast(t('devices.synced', { days: c.days ?? 0 }), 'success');
        }
      } else if (kind === 'sync') {
        const c = await syncHealth(7);
        toast(t('devices.synced', { days: c.days ?? 0 }), 'success');
      } else {
        await disconnectHealth();
        toast(t('devices.disconnected', { app: name }));
      }
    } catch {
      toast(t('devices.failed'), 'error');
    } finally {
      setBusy(null);
      refresh();
    }
  };

  return (
    <Card id="devices" className="flex scroll-mt-24 flex-col gap-4">
      <CardHeader title={t('devices.title')} icon={<Watch className="h-5 w-5" strokeWidth={1.75} />} />
      <OnDeviceSteps />
      {/* Cloud watches need the Open Wearables backend: hidden until the admin switches the flag on. */}
      {features.cloudWearables && <CloudWearables />}
      {!status ? (
        <Skeleton className="h-24" />
      ) : status.availability === 'web' ? (
        <div className="flex flex-col gap-3" id="devices-web">
          <p className="text-body text-ink">{t('devices.webTitle')}</p>
          <p className="text-small text-muted">{t('devices.webBody')}</p>
          {app.androidUrl || app.iosUrl ? (
            <div className="flex flex-wrap gap-2">
              {app.androidUrl && (
                <a className="inline-flex min-h-11 items-center rounded-button border border-line px-4 text-small font-semibold text-ink hover:bg-raised" href={app.androidUrl} target="_blank" rel="noopener noreferrer">
                  {t('devices.getAndroid')}
                </a>
              )}
              {app.iosUrl && (
                <a className="inline-flex min-h-11 items-center rounded-button border border-line px-4 text-small font-semibold text-ink hover:bg-raised" href={app.iosUrl} target="_blank" rel="noopener noreferrer">
                  {t('devices.getIos')}
                </a>
              )}
            </div>
          ) : (
            <p className="text-small text-muted">{t('devices.appsSoon')}</p>
          )}
        </div>
      ) : status.availability === 'missing' ? (
        <div className="flex flex-col gap-2" id="devices-missing">
          <p className="text-body text-ink">{t(healthAppName() === 'healthConnect' ? 'devices.installHealthConnect' : 'devices.healthKitMissing')}</p>
          {healthAppName() === 'healthConnect' && (
            <Button variant="secondary" onClick={() => void openHealthSettings().catch(() => undefined)}>
              {t('devices.openHealthConnect')}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4" id="devices-native">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary-text">
              <Smartphone className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-ink">{name}</p>
              <p className="text-small text-muted">
                {status.connected
                  ? status.lastSyncAt
                    ? t('devices.lastSync', { when: dateTime(status.lastSyncAt) })
                    : t('devices.notSyncedYet')
                  : t('devices.notConnected')}
              </p>
            </div>
            <Badge tone={status.connected ? 'primary' : 'neutral'}>{status.connected ? t('devices.connected') : t('devices.off')}</Badge>
          </div>
          <p className="text-small text-muted">{t(`devices.sourcesHint.${healthAppName()}`)}</p>
          {status.connected && (status.granted.length > 0 || healthAppName() === 'healthConnect') && (
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2" aria-label={t('devices.permissions')}>
              {HEALTH_TYPES.map((type) => {
                const ok = status.granted.includes(type);
                return (
                  <li key={type} className="flex items-center gap-2 text-small text-ink">
                    {ok ? <Check className="h-4 w-4 text-primary-text" strokeWidth={2} aria-hidden /> : <X className="h-4 w-4 text-muted" strokeWidth={2} aria-hidden />}
                    <span>{t(`devices.types.${type}`)}</span>
                    <span className="sr-only">{ok ? t('devices.allowed') : t('devices.notAllowed')}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {healthAppName() === 'healthKit' && status.connected && <p className="text-caption text-muted">{t('devices.iosPrivacy')}</p>}
          <div className="flex flex-wrap gap-2">
            {status.connected ? (
              <>
                <Button id="devices-sync" loading={busy === 'sync'} icon={<RefreshCw className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={() => void run('sync')}>
                  {t('devices.syncNow')}
                </Button>
                <Button variant="secondary" onClick={() => void openHealthSettings().catch(() => undefined)}>
                  {t('devices.managePermissions')}
                </Button>
                <Button id="devices-disconnect" variant="ghost" loading={busy === 'disconnect'} onClick={() => void run('disconnect')}>
                  {t('devices.disconnect')}
                </Button>
              </>
            ) : (
              <Button id="devices-connect" loading={busy === 'connect'} onClick={() => void run('connect')}>
                {t('devices.connect', { app: name })}
              </Button>
            )}
          </div>
          <p className="text-caption text-muted">{t('devices.keepData')}</p>
        </div>
      )}
    </Card>
  );
}
