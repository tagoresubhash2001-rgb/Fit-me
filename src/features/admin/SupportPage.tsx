import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, Skeleton, Tabs, toast } from '../../components/ui';
import { act, errorCode, fmtDate, useAction } from './api';
import { Field, inputCls } from './ui';

type Row = Record<string, unknown> & { id: string };

function Inbox() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<'open' | 'answered' | 'closed' | 'all'>('open');
  const r = useAction<{ rows: Row[] }>('support.list', { status }, [status]);
  const [reply, setReply] = useState<Record<string, string>>({});
  const send = async (id: string, next: 'open' | 'answered' | 'closed') => {
    try {
      await act('support.reply', { id, reply: reply[id]?.trim() || undefined, status: next });
      setReply({ ...reply, [id]: '' });
      toast(t('admin.saved'), 'success');
      r.reload();
    } catch (e) {
      toast(errorCode(e), 'error');
    }
  };
  return (
    <Card className="flex flex-col gap-4" id="support-inbox">
      <CardHeader title={t('admin.support.inbox')} subtitle={t('admin.support.inboxBody')} />
      <Field label={t('admin.finance.status')}>
        <select className={`${inputCls} w-auto`} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          {(['open', 'answered', 'closed', 'all'] as const).map((s) => (
            <option key={s} value={s}>
              {t(`admin.support.statuses.${s}`)}
            </option>
          ))}
        </select>
      </Field>
      {!r.data ? (
        r.error ? <p className="text-small text-danger-text">{r.error}</p> : <Skeleton className="h-24" />
      ) : r.data.rows.length === 0 ? (
        <EmptyState title={t('admin.support.none')} />
      ) : (
        <ul className="flex flex-col gap-3">
          {r.data.rows.map((m) => (
            <li key={m.id} className="flex flex-col gap-2 rounded-input border border-line p-3">
              <div className="flex flex-wrap items-center gap-2 text-caption text-muted">
                <Badge>{t(`support.topics.${String(m.topic)}`)}</Badge>
                <span>{String(m.email ?? m.uid)}</span>
                <span>{fmtDate(m.createdAt as number, i18n.language)}</span>
                <Badge tone={m.status === 'open' ? 'accent' : 'neutral'}>{t(`admin.support.statuses.${String(m.status)}`)}</Badge>
              </div>
              <p className="whitespace-pre-wrap text-small text-ink">{String(m.message)}</p>
              {((m.replies as Array<{ text: string; at: number }>) ?? []).map((x, i) => (
                <p key={i} className="rounded-input bg-raised px-3 py-2 text-small text-ink">
                  {x.text}
                </p>
              ))}
              <textarea rows={2} className="w-full rounded-input border border-line bg-surface px-3 py-2 text-body text-ink" value={reply[m.id] ?? ''} onChange={(e) => setReply({ ...reply, [m.id]: e.target.value })} placeholder={t('admin.support.replyPlaceholder')} aria-label={t('admin.support.reply')} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={!reply[m.id]?.trim()} onClick={() => void send(m.id, 'answered')}>
                  {t('admin.support.sendReply')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void send(m.id, m.status === 'closed' ? 'open' : 'closed')}>
                  {m.status === 'closed' ? t('admin.support.reopen') : t('admin.support.close')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Diagnostic reports sent from Settings, Send diagnostics (permissions, sources, sync times, errors; no health values). */
export function Diagnostics({ uid }: { uid?: string }) {
  const { t, i18n } = useTranslation();
  const r = useAction<{ rows: Row[] }>('users.diagnostics', uid ? { uid } : {}, [uid]);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Card className="flex flex-col gap-3" id="diagnostics">
      <CardHeader title={t('admin.support.diagnostics')} subtitle={t('admin.support.diagnosticsBody')} />
      {!r.data ? (
        r.error ? <p className="text-small text-danger-text">{r.error}</p> : <Skeleton className="h-24" />
      ) : r.data.rows.length === 0 ? (
        <EmptyState title={t('admin.support.noDiagnostics')} />
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {r.data.rows.map((d) => (
            <li key={d.id} className="py-2">
              <button type="button" className="flex w-full flex-wrap items-center gap-2 text-start text-small text-ink" onClick={() => setOpen(open === d.id ? null : d.id)} aria-expanded={open === d.id}>
                <span className="font-medium">{String(d.email ?? d.uid)}</span>
                <span className="text-muted">{fmtDate(d.createdAt as number, i18n.language)}</span>
                <span className="text-muted">
                  {String((d.app as { platform?: string })?.platform)} {String((d.app as { version?: string })?.version)}
                </span>
                {((d.errors as unknown[]) ?? []).length > 0 && <Badge tone="accent">{t('admin.support.errors', { count: (d.errors as unknown[]).length })}</Badge>}
              </button>
              {open === d.id && <pre className="mt-2 max-h-96 overflow-auto rounded-input bg-raised p-3 text-caption text-ink">{JSON.stringify({ ...d, id: undefined }, null, 2)}</pre>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function SupportPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'inbox' | 'diagnostics'>('inbox');
  return (
    <div className="flex flex-col gap-4" id="admin-support">
      <PageHeader title={t('admin.nav.support')} />
      <Tabs value={tab} onChange={setTab} ariaLabel={t('admin.nav.support')} items={[{ id: 'inbox', label: t('admin.support.inbox') }, { id: 'diagnostics', label: t('admin.support.diagnostics') }]} />
      {tab === 'inbox' ? <Inbox /> : <Diagnostics />}
    </div>
  );
}
