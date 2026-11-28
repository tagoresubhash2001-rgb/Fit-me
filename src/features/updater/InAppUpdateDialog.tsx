import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { doc, getDoc } from 'firebase/firestore';
import { Download, ExternalLink, RefreshCw } from 'lucide-react';
import { db } from '../../lib/firebase';
import { isNative, platform } from '../../lib/platform';
import { Button } from '../../components/ui';
import { parseAndroid, type AndroidRelease } from '../website/release';
import { updateState } from './updateState';

interface FitMeStepsPlugin {
  canRequestPackageInstalls(): Promise<{ granted: boolean }>;
  openInstallPermissionSettings(): Promise<void>;
  installApk(options: { url: string }): Promise<{ success: boolean }>;
}
const Native = registerPlugin<FitMeStepsPlugin>('FitMeSteps');
const SITE = 'https://fit-me1.web.app';

/**
 * Direct-download Android app only: compares the installed build (from the OS, never hard-coded) with
 * app_config/android. A newer build offers an update; a build below the minimum supported version must update.
 */
export function InAppUpdateDialog() {
  const { t } = useTranslation();
  const [release, setRelease] = useState<AndroidRelease | null>(null);
  const [installed, setInstalled] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isNative() || platform() !== 'android') return;
    void App.getInfo()
      .then((i) => setInstalled(Number(i.build) || null))
      .catch(() => setInstalled(null));
    void getDoc(doc(db(), 'app_config/android'))
      .then((s) => setRelease(parseAndroid(s.exists() ? s.data() : undefined)))
      .catch(() => undefined);
  }, []);

  const state = updateState(installed, release?.versionCode ?? null, release?.minSupportedVersionCode ?? null);
  if (!release || state === 'none' || (state === 'optional' && dismissed)) return null;
  const forced = state === 'forced';
  const url = release.apkUrl?.startsWith('https://') ? release.apkUrl : `${SITE}/download/android`;

  const update = async () => {
    setBusy(true);
    setError(false);
    try {
      const { granted } = await Native.canRequestPackageInstalls().catch(() => ({ granted: true }));
      if (!granted) {
        setNeedsPermission(true);
        return;
      }
      await Native.installApk({ url });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9000] flex items-end justify-center bg-scrim p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="update-title">
      <div className="w-full max-w-md rounded-card border border-card-border bg-surface p-6 shadow-card">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-subtle text-primary-text">
            <RefreshCw className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h2 id="update-title" className="text-title text-ink">
              {forced ? t('updater.requiredTitle') : t('updater.availableTitle')}
            </h2>
            {release.version && <p className="text-caption text-muted">{t('updater.version', { version: release.version })}</p>}
          </div>
        </div>
        <p className="text-small text-muted">{forced ? t('updater.requiredBody') : t('updater.availableBody')}</p>
        {release.releaseNotes && <p className="mt-3 rounded-input bg-raised p-3 text-small whitespace-pre-line text-ink">{release.releaseNotes}</p>}
        {error && (
          <p role="alert" className="mt-3 text-small text-danger-text">
            {t('updater.failed')}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          {needsPermission ? (
            <Button
              icon={<ExternalLink className="h-4 w-4" />}
              onClick={() => {
                void Native.openInstallPermissionSettings().catch(() => undefined);
                setNeedsPermission(false);
              }}
            >
              {t('updater.allowInstall')}
            </Button>
          ) : (
            <Button loading={busy} icon={<Download className="h-4 w-4" />} onClick={() => void update()}>
              {release.sizeMB ? t('updater.updateSize', { size: release.sizeMB }) : t('updater.update')}
            </Button>
          )}
          {!forced && (
            <Button variant="secondary" onClick={() => setDismissed(true)}>
              {t('updater.later')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
