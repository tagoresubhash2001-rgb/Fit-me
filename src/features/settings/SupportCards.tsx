import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LifeBuoy, Stethoscope } from 'lucide-react';
import { Button, Card, toast } from '../../components/ui';
import { useFeatures } from '../../data/appConfig';
import { sendDiagnostics } from '../../lib/diagnostics';

/** Settings: Help and contact, and Send diagnostics (technical report for support; no health values). */
export function SupportCards() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const features = useFeatures();
  const [busy, setBusy] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);
  return (
    <>
      <Card id="help-entry" className="flex items-center gap-3">
        <LifeBuoy className="h-5 w-5 shrink-0 text-primary-text" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-ink">{t('help.title')}</p>
          <p className="text-small text-muted">{t('help.entryBody')}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => navigate('/help')}>
          {t('stories.open')}
        </Button>
      </Card>
      {features.diagnostics && (
        <Card id="diagnostics-entry" className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-5 w-5 shrink-0 text-primary-text" strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-ink">{t('diagnostics.title')}</p>
              <p className="text-small text-muted">{t('diagnostics.body')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              id="send-diagnostics"
              size="sm"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const id = await sendDiagnostics();
                  setSentId(id);
                  toast(t('diagnostics.sent'), 'success');
                } catch {
                  toast(t('diagnostics.failed'), 'error');
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t('diagnostics.send')}
            </Button>
            {sentId && <span className="text-caption text-muted">{t('diagnostics.reference', { id: sentId.slice(0, 8) })}</span>}
          </div>
        </Card>
      )}
    </>
  );
}
