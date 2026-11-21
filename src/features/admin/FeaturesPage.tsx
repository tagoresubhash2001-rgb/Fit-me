import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { Button, Card, PageHeader, Skeleton, toast } from '../../components/ui';
import { db } from '../../lib/firebase';
import { DEFAULT_FEATURES, FEATURE_KEYS, FeatureFlags } from '../../domain/appConfig';
import { call, errorCode } from './api';

/** Switch features off and on. Off hides the entry points (and the server refuses the action); no data is deleted. */
export default function FeaturesPage() {
  const { t } = useTranslation();
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getDoc(doc(db(), 'appConfig/features'))
      .then((s) => setFlags((FeatureFlags.safeParse(s.data() ?? {}).data as FeatureFlags | undefined) ?? DEFAULT_FEATURES))
      .catch(() => setFlags(DEFAULT_FEATURES));
  }, []);
  if (!flags) return <Skeleton className="h-64" />;
  return (
    <div className="flex flex-col gap-4" id="admin-features">
      <PageHeader title={t('admin.nav.features')} />
      <Card className="flex flex-col divide-y divide-line">
        {FEATURE_KEYS.map((k) => (
          <label key={k} className="flex min-h-14 items-center gap-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block text-body text-ink">{t(`admin.features.${k}.title`)}</span>
              <span className="block text-caption text-muted">{t(`admin.features.${k}.body`)}</span>
            </span>
            <input id={`flag-${k}`} type="checkbox" role="switch" checked={flags[k]} onChange={(e) => setFlags({ ...flags, [k]: e.target.checked })} className="h-6 w-6 accent-[var(--primary)]" />
          </label>
        ))}
      </Card>
      <p className="text-caption text-muted">{t('admin.features.safety')}</p>
      <div>
        <Button
          id="save-features"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await call<{ version: number }>('adminSaveFeatures', { config: flags });
              toast(t('admin.savedVersion', { version: r.version }), 'success');
            } catch (e) {
              toast(errorCode(e), 'error');
            } finally {
              setBusy(false);
            }
          }}
        >
          {t('admin.save')}
        </Button>
      </div>
    </div>
  );
}
