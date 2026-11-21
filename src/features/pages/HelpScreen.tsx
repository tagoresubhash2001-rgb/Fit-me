import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { Link } from 'react-router-dom';
import { Button, Card, CardHeader, PageHeader, Skeleton, toast } from '../../components/ui';
import { functions } from '../../lib/firebase';
import { localized, type PageDoc } from '../../domain/appConfig';
import { listPages } from '../../data/pages';
import { useAppSettings, useFeatures } from '../../data/appConfig';
import { PageBody } from './PageView';

const TOPICS = ['help', 'bug', 'billing', 'feedback', 'other'] as const;

/** Help: FAQ and articles from the admin's page editor, plus a contact form that lands in the admin support inbox. */
export default function HelpScreen() {
  const { t, i18n } = useTranslation();
  const features = useFeatures();
  const app = useAppSettings();
  const [pages, setPages] = useState<PageDoc[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>('help');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    listPages()
      .then((p) => setPages(p.filter((x) => x.kind === 'faq' || x.kind === 'help' || x.kind === 'legal')))
      .catch(() => setPages([]));
  }, []);
  return (
    <div className="flex flex-col gap-4" id="help-screen">
      <PageHeader title={t('help.title')} />
      <Card className="flex flex-col gap-2">
        <CardHeader title={t('help.faq')} />
        {!pages ? (
          <Skeleton className="h-24" />
        ) : pages.length === 0 ? (
          <p className="text-small text-muted">{t('help.noArticles')}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {pages.map((p) => (
              <li key={p.slug} className="py-1">
                <button type="button" className="flex min-h-11 w-full items-center text-start text-body text-ink" aria-expanded={open === p.slug} onClick={() => setOpen(open === p.slug ? null : p.slug)}>
                  {localized(p.title, i18n.language)}
                </button>
                {open === p.slug && (
                  <div className="pb-3">
                    <PageBody text={localized(p.body, i18n.language) ?? ''} />
                    <Link className="mt-2 inline-block text-small font-semibold text-primary-text" to={`/p/${p.slug}`}>
                      {t('help.openPage')}
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      {features.contact && (
        <Card className="flex flex-col gap-3" id="contact-form">
          <CardHeader title={t('help.contactTitle')} subtitle={t('help.contactBody')} />
          <label className="flex flex-col gap-1.5">
            <span className="text-small font-medium text-ink">{t('help.topic')}</span>
            <select className="h-11 rounded-input border border-line bg-surface px-3 text-body text-ink" value={topic} onChange={(e) => setTopic(e.target.value as typeof topic)}>
              {TOPICS.map((x) => (
                <option key={x} value={x}>
                  {t(`support.topics.${x}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-small font-medium text-ink">{t('help.message')}</span>
            <textarea id="contact-message" rows={5} maxLength={3000} className="w-full rounded-input border border-line bg-surface px-3 py-2 text-body text-ink" value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <div>
            <Button
              id="contact-send"
              loading={busy}
              disabled={message.trim().length < 5}
              onClick={async () => {
                setBusy(true);
                try {
                  await httpsCallable(functions(), 'memberAction', { timeout: 30000 })({ action: 'contact.send', data: { topic, message: message.trim() } });
                  toast(t('help.sent'), 'success');
                  setMessage('');
                } catch {
                  toast(t('help.failed'), 'error');
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t('help.send')}
            </Button>
          </div>
          {app.supportEmail && <p className="text-caption text-muted">{t('help.orEmail', { email: app.supportEmail })}</p>}
        </Card>
      )}
    </div>
  );
}
