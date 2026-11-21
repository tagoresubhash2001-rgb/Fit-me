import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, Download } from 'lucide-react';
import { BrandLogo, Button, Card } from '../components/ui';
import { useAppSettings, useApplyStringOverrides } from '../data/appConfig';
import { localized, versionBelow } from '../domain/appConfig';
import { isNative, platform } from '../lib/platform';

/** Native app version (web builds always pass the force-update check). */
function useNativeVersion(): string | null {
  const [v, setV] = useState<string | null>(null);
  useEffect(() => {
    if (!isNative()) return;
    void import('@capacitor/app').then(({ App }) => App.getInfo().then((i) => setV(i.version))).catch(() => undefined);
  }, []);
  return v;
}

function Screen({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-canvas px-4">
      <Card className="flex w-full max-w-sm flex-col items-start gap-3" id="gate-screen">
        <BrandLogo size={36} textClassName="text-title" />
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-subtle text-primary-text">{icon}</span>
        <h1 className="text-title text-ink">{title}</h1>
        <p className="text-body text-muted">{body}</p>
        {action}
      </Card>
    </div>
  );
}

/**
 * Maintenance mode, minimum app version and the admin's text overrides. Loaded just after the first paint (so the
 * sign-in screen stays light) and shown as a full-screen layer over the app when one applies.
 */
export default function LateGates() {
  const { t, i18n } = useTranslation();
  const app = useAppSettings();
  const version = useNativeVersion();
  useApplyStringOverrides();
  if (app.maintenance.enabled)
    return (
      <Screen
        icon={<Wrench className="h-5 w-5" strokeWidth={1.75} />}
        title={t('gates.maintenanceTitle')}
        body={localized(app.maintenance.message, i18n.language) || t('gates.maintenanceBody')}
      />
    );
  if (version && versionBelow(version, app.minAppVersion)) {
    const url = platform() === 'ios' ? app.iosUrl : app.androidUrl;
    return (
      <Screen
        icon={<Download className="h-5 w-5" strokeWidth={1.75} />}
        title={t('gates.updateTitle')}
        body={t('gates.updateBody')}
        action={
          url ? (
            <Button onClick={() => window.open(url, '_system')} id="gate-update">
              {t('gates.update')}
            </Button>
          ) : undefined
        }
      />
    );
  }
  return null;
}
