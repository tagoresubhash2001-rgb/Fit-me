import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardHeader, PageHeader, Skeleton, toast } from '../../components/ui';
import { act, errorCode, fmtDate, useAction } from './api';
import { inputCls } from './ui';

interface Row {
  name: string;
  set: boolean;
  version: string | null;
  updatedAt: string | null;
}

/**
 * API and integration keys (super admin only). Keys go straight to Google Secret Manager through a Cloud Function:
 * they are never stored in Firestore or shown again; the screen only shows whether a key is set and a test result.
 */
export default function IntegrationsPage() {
  const { t, i18n } = useTranslation();
  const r = useAction<{ rows: Row[] }>('integrations.status', {});
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; detail: string }>>({});
  return (
    <div className="flex flex-col gap-4" id="admin-integrations">
      <PageHeader title={t('admin.nav.integrations')} subtitle={t('admin.integrations.subtitle')} />
      {!r.data ? (
        r.error ? <p className="text-small text-danger-text">{r.error}</p> : <Skeleton className="h-48" />
      ) : (
        r.data.rows.map((x) => (
          <Card key={x.name} className="flex flex-col gap-3" id={`key-${x.name}`}>
            <CardHeader title={t(`admin.integrations.names.${x.name}`)} subtitle={t(`admin.integrations.hints.${x.name}`)} />
            <div className="flex flex-wrap items-center gap-2 text-small">
              <Badge tone={x.set ? 'primary' : 'neutral'}>{x.set ? t('admin.integrations.set') : t('admin.integrations.notSet')}</Badge>
              {x.set && <span className="text-muted">{t('admin.integrations.version', { version: x.version, when: x.updatedAt ? fmtDate(Date.parse(x.updatedAt), i18n.language) : '—' })}</span>}
              {x.set && <span className="font-mono text-muted">••••••••</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <input type="password" autoComplete="off" className={`${inputCls} min-w-0 flex-1`} placeholder={t('admin.integrations.newValue')} value={values[x.name] ?? ''} onChange={(e) => setValues({ ...values, [x.name]: e.target.value })} aria-label={t('admin.integrations.newValue')} />
              <Button
                loading={busy === `${x.name}-set`}
                disabled={(values[x.name] ?? '').trim().length < 8}
                onClick={async () => {
                  setBusy(`${x.name}-set`);
                  try {
                    await act('integrations.set', { name: x.name, value: values[x.name] });
                    setValues({ ...values, [x.name]: '' });
                    toast(t('admin.integrations.saved'), 'success');
                    r.reload();
                  } catch (e) {
                    toast(errorCode(e), 'error');
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                {t('admin.save')}
              </Button>
              <Button
                variant="secondary"
                loading={busy === `${x.name}-test`}
                disabled={!x.set}
                onClick={async () => {
                  setBusy(`${x.name}-test`);
                  try {
                    const res = await act<{ ok: boolean; detail: string }>('integrations.test', { name: x.name });
                    setResults({ ...results, [x.name]: res });
                  } catch (e) {
                    setResults({ ...results, [x.name]: { ok: false, detail: errorCode(e) } });
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                {t('admin.integrations.test')}
              </Button>
            </div>
            {results[x.name] && (
              <p role="status" className={results[x.name].ok ? 'text-small text-primary-text' : 'text-small text-danger-text'}>
                {results[x.name].ok ? t('admin.integrations.ok') : t('admin.integrations.failed')} ({results[x.name].detail})
              </p>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
