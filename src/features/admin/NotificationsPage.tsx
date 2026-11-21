import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, Skeleton, Tabs, toast } from '../../components/ui';
import { Announcement } from '../../domain/appConfig';
import { act, errorCode, fmtDate, useAction } from './api';
import { Field, inputCls, Table, Td } from './ui';

type Audience = 'all' | 'country' | 'plan' | 'user';
type Row = Record<string, unknown> & { id: string };

function Send({ onSent }: { onSent: () => void }) {
  const { t } = useTranslation();
  const tpl = useAction<{ rows: Array<{ id: string; title: Record<string, string>; body: Record<string, string> }> }>('templates.list', {});
  const [audience, setAudience] = useState<Audience>('all');
  const [value, setValue] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sendAt, setSendAt] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = title.trim() && body.trim() && (audience === 'all' || value.trim());
  return (
    <Card className="flex flex-col gap-4" id="notify-send">
      <CardHeader title={t('admin.notify.send')} subtitle={t('admin.notify.sendBody')} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label={t('admin.notify.audience')}>
          <select id="notify-audience" className={inputCls} value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
            {(['all', 'country', 'plan', 'user'] as const).map((a) => (
              <option key={a} value={a}>
                {t(`admin.notify.audiences.${a}`)}
              </option>
            ))}
          </select>
        </Field>
        {audience !== 'all' && (
          <Field label={t(`admin.notify.value.${audience}`)}>
            {audience === 'plan' ? (
              <select className={inputCls} value={value} onChange={(e) => setValue(e.target.value)}>
                <option value="" />
                {(['free', 'premium', 'pro'] as const).map((p) => (
                  <option key={p} value={p}>
                    {t(`plans.${p}`)}
                  </option>
                ))}
              </select>
            ) : (
              <input id="notify-value" className={inputCls} value={value} onChange={(e) => setValue(audience === 'country' ? e.target.value.toUpperCase() : e.target.value.trim())} />
            )}
          </Field>
        )}
        <Field label={t('admin.notify.sendAt')} hint={t('admin.notify.sendAtHint')}>
          <input type="datetime-local" className={inputCls} value={sendAt} onChange={(e) => setSendAt(e.target.value)} />
        </Field>
      </div>
      {tpl.data && tpl.data.rows.length > 0 && (
        <Field label={t('admin.notify.template')}>
          <select
            className={inputCls}
            onChange={(e) => {
              const x = tpl.data?.rows.find((r) => r.id === e.target.value);
              if (x) {
                setTitle(x.title.en ?? '');
                setBody(x.body.en ?? '');
              }
            }}
          >
            <option value="" />
            {tpl.data.rows.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label={t('admin.notify.title')}>
        <input id="notify-title" className={inputCls} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label={t('admin.notify.message')}>
        <textarea id="notify-body" rows={3} maxLength={400} className="w-full rounded-input border border-line bg-surface px-3 py-2 text-body text-ink" value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button
          id="notify-submit"
          loading={busy}
          disabled={!ok}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await act<{ status: string; recipients?: number }>('notify.send', {
                audience,
                value: audience === 'all' ? null : value,
                title: { en: title.trim() },
                body: { en: body.trim() },
                sendAt: sendAt ? new Date(sendAt).toISOString() : null,
                push: true,
              });
              toast(r.status === 'scheduled' ? t('admin.notify.scheduled') : t('admin.notify.sent', { count: r.recipients ?? 0 }), 'success');
              setTitle('');
              setBody('');
              setSendAt('');
              onSent();
            } catch (e) {
              toast(errorCode(e), 'error');
            } finally {
              setBusy(false);
            }
          }}
        >
          {sendAt ? t('admin.notify.schedule') : t('admin.notify.sendNow')}
        </Button>
        <Button
          variant="ghost"
          disabled={!title.trim() || !body.trim()}
          onClick={async () => {
            const id = window.prompt(t('admin.notify.templateName'))?.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            if (!id) return;
            try {
              await act('templates.save', { id, title: { en: title.trim() }, body: { en: body.trim() } });
              toast(t('admin.saved'), 'success');
              tpl.reload();
            } catch (e) {
              toast(errorCode(e), 'error');
            }
          }}
        >
          {t('admin.notify.saveTemplate')}
        </Button>
      </div>
      <p className="text-caption text-muted">{t('admin.notify.pushNote')}</p>
    </Card>
  );
}

function History({ tick }: { tick: number }) {
  const { t, i18n } = useTranslation();
  const r = useAction<{ rows: Row[] }>('notify.list', {}, [tick]);
  return (
    <Card className="flex flex-col gap-3" id="notify-history">
      <CardHeader title={t('admin.notify.history')} />
      {!r.data ? (
        <Skeleton className="h-24" />
      ) : r.data.rows.length === 0 ? (
        <EmptyState title={t('admin.notify.none')} />
      ) : (
        <Table head={[t('admin.finance.date'), t('admin.notify.title'), t('admin.notify.audience'), t('admin.finance.status'), t('admin.notify.recipients'), '']} label={t('admin.notify.history')}>
          {r.data.rows.map((n) => (
            <tr key={n.id}>
              <Td>{fmtDate((n.createdAt as number) ?? null, i18n.language)}</Td>
              <Td>{(n.title as Record<string, string>)?.en}</Td>
              <Td>
                {t(`admin.notify.audiences.${String(n.audience)}`)}
                {n.value ? ` · ${String(n.value)}` : ''}
              </Td>
              <Td>
                <Badge tone={n.status === 'sent' ? 'primary' : 'neutral'}>{String(n.status)}</Badge>
              </Td>
              <Td className="tabular-nums">{n.recipients !== undefined ? `${String(n.recipients)} / ${String(n.pushed ?? 0)}` : '—'}</Td>
              <Td>
                {n.status === 'scheduled' && (
                  <Button size="sm" variant="ghost" onClick={() => void act('notify.cancel', { id: n.id }).then(r.reload).catch((e) => toast(errorCode(e), 'error'))}>
                    {t('common.cancel')}
                  </Button>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

function Announcements() {
  const { t } = useTranslation();
  const r = useAction<{ rows: Array<Announcement & { id: string }> }>('announcements.list', {});
  const blank: Announcement = { active: true, title: {}, body: {}, startsAt: null, endsAt: null, countries: [], plans: [] };
  const [a, setA] = useState<Announcement>(blank);
  const [id, setId] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  return (
    <Card className="flex flex-col gap-4" id="announcements">
      <CardHeader title={t('admin.notify.announcements')} subtitle={t('admin.notify.announcementsBody')} />
      <Field label={t('admin.notify.title')}>
        <input id="ann-title" className={inputCls} maxLength={80} value={a.title.en ?? ''} onChange={(e) => setA({ ...a, title: { ...a.title, en: e.target.value } })} />
      </Field>
      <Field label={t('admin.notify.message')}>
        <textarea rows={2} maxLength={400} className="w-full rounded-input border border-line bg-surface px-3 py-2 text-body text-ink" value={a.body.en ?? ''} onChange={(e) => setA({ ...a, body: { ...a.body, en: e.target.value } })} />
      </Field>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label={t('admin.content.startsAt')}>
          <input type="date" className={inputCls} value={a.startsAt?.slice(0, 10) ?? ''} onChange={(e) => setA({ ...a, startsAt: e.target.value ? new Date(`${e.target.value}T00:00:00Z`).toISOString() : null })} />
        </Field>
        <Field label={t('admin.content.endsAt')}>
          <input type="date" className={inputCls} value={a.endsAt?.slice(0, 10) ?? ''} onChange={(e) => setA({ ...a, endsAt: e.target.value ? new Date(`${e.target.value}T23:59:59Z`).toISOString() : null })} />
        </Field>
        <Field label={t('admin.content.countries')} hint={t('admin.coupons.emptyAll')}>
          <input className={inputCls} defaultValue={a.countries.join(', ')} key={id ?? 'new'} onBlur={(e) => setA({ ...a, countries: e.target.value.toUpperCase().split(/[^A-Z]+/).filter((c) => c.length === 2) })} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-4">
        {(['free', 'premium', 'pro'] as const).map((p) => (
          <label key={p} className="flex items-center gap-1.5 text-small text-ink">
            <input type="checkbox" checked={a.plans.includes(p)} onChange={(e) => setA({ ...a, plans: e.target.checked ? [...a.plans, p] : a.plans.filter((x) => x !== p) })} />
            {t(`plans.${p}`)}
          </label>
        ))}
        <label className="flex items-center gap-1.5 text-small text-ink">
          <input type="checkbox" checked={a.active} onChange={(e) => setA({ ...a, active: e.target.checked })} />
          {t('admin.content.active')}
        </label>
      </div>
      <div className="flex gap-2">
        <Button
          id="ann-save"
          loading={busy}
          disabled={!Announcement.safeParse(a).success || !a.title.en}
          onClick={async () => {
            setBusy(true);
            try {
              await act('announcements.save', { id, announcement: a });
              toast(t('admin.saved'), 'success');
              setA(blank);
              setId(undefined);
              r.reload();
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
      {r.data && r.data.rows.length > 0 && (
        <ul className="flex flex-col divide-y divide-line">
          {r.data.rows.map((x) => (
            <li key={x.id} className="flex items-center gap-2 py-2">
              <span className="min-w-0 flex-1 text-small text-ink">{x.title.en}</span>
              <Badge tone={x.active ? 'primary' : 'neutral'}>{x.active ? t('admin.active') : t('admin.inactive')}</Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setA(Announcement.parse(x));
                  setId(x.id);
                }}
              >
                {t('admin.edit')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'send' | 'announcements'>('send');
  const [tick, setTick] = useState(0);
  return (
    <div className="flex flex-col gap-4" id="admin-notifications">
      <PageHeader title={t('admin.nav.notifications')} />
      <Tabs value={tab} onChange={setTab} ariaLabel={t('admin.nav.notifications')} items={[{ id: 'send', label: t('admin.notify.tabSend') }, { id: 'announcements', label: t('admin.notify.tabAnnouncements') }]} />
      {tab === 'send' ? (
        <>
          <Send onSent={() => setTick((x) => x + 1)} />
          <History tick={tick} />
        </>
      ) : (
        <Announcements />
      )}
    </div>
  );
}
