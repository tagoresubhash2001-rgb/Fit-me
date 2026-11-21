import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { Button, Card, PageHeader, Skeleton, toast } from '../../components/ui';
import { db } from '../../lib/firebase';
import { AppSettings, DEFAULT_APP_SETTINGS } from '../../domain/appConfig';
import { call, errorCode } from './api';
import { Field, inputCls } from './ui';

const KEYS = ['androidUrl', 'iosUrl', 'supportEmail', 'privacyUrl', 'termsUrl'] as const;

/** Application configuration: store links (shown only once set), support and legal links. */
export default function SettingsPage() {
  const { t } = useTranslation();
  const [cfg, setCfg] = useState<AppSettings | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getDoc(doc(db(), 'appConfig/app'))
      .then((s) => setCfg(AppSettings.safeParse(s.data() ?? {}).data ?? DEFAULT_APP_SETTINGS))
      .catch(() => setCfg(DEFAULT_APP_SETTINGS));
  }, []);
  if (!cfg) return <Skeleton className="h-48" />;
  const valid = AppSettings.safeParse(cfg);
  return (
    <div className="flex flex-col gap-4" id="admin-settings">
      <PageHeader title={t('admin.nav.settings')} />
      <Card className="flex flex-col gap-3">
        {KEYS.map((k) => (
          <Field key={k} label={t(`admin.settings.${k}`)} hint={t(`admin.settings.${k}Hint`)}>
            <input id={`setting-${k}`} className={inputCls} type={k === 'supportEmail' ? 'email' : 'url'} value={cfg[k] ?? ''} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value.trim() || null })} />
          </Field>
        ))}
        <Field label={t('admin.settings.supportPhone')}>
          <input className={inputCls} type="tel" value={cfg.supportPhone ?? ''} onChange={(e) => setCfg({ ...cfg, supportPhone: e.target.value.trim() || null })} />
        </Field>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(['instagram', 'youtube', 'x', 'facebook'] as const).map((k) => (
            <Field key={k} label={t(`admin.settings.social.${k}`)}>
              <input className={inputCls} type="url" value={cfg.social[k] ?? ''} onChange={(e) => setCfg({ ...cfg, social: { ...cfg.social, [k]: e.target.value.trim() || null } })} />
            </Field>
          ))}
        </div>
        <fieldset className="flex flex-col gap-3 rounded-input border border-line p-3" id="maintenance">
          <legend className="px-1 text-small font-semibold text-ink">{t('admin.settings.maintenanceTitle')}</legend>
          <label className="flex items-center gap-3 text-small text-ink">
            <input id="maintenance-on" type="checkbox" checked={cfg.maintenance.enabled} onChange={(e) => setCfg({ ...cfg, maintenance: { ...cfg.maintenance, enabled: e.target.checked } })} className="h-5 w-5" />
            {t('admin.settings.maintenanceOn')}
          </label>
          <Field label={t('admin.settings.maintenanceMessage')} hint={t('admin.settings.maintenanceHint')}>
            <input className={inputCls} maxLength={300} value={cfg.maintenance.message.en ?? ''} onChange={(e) => setCfg({ ...cfg, maintenance: { ...cfg.maintenance, message: { ...cfg.maintenance.message, en: e.target.value } } })} />
          </Field>
        </fieldset>
        <Field label={t('admin.settings.minAppVersion')} hint={t('admin.settings.minAppVersionHint')}>
          <input id="min-version" className={inputCls} value={cfg.minAppVersion ?? ''} placeholder="1.0.0" onChange={(e) => setCfg({ ...cfg, minAppVersion: e.target.value.trim() || null })} />
        </Field>
        {!valid.success && <p className="text-small text-danger-text">{t('admin.settings.invalid')}</p>}
        <div>
          <Button
            id="save-settings"
            loading={busy}
            disabled={!valid.success}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await call<{ version: number }>('adminSaveAppSettings', { config: cfg });
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
      </Card>
    </div>
  );
}
