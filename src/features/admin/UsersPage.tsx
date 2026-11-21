import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Badge, Button, Card, EmptyState, PageHeader, Sheet, Skeleton, toast } from '../../components/ui';
import { atLeast, call, errorCode, fmtDate, type Role } from './api';
import { Confirm, Table, Td, inputCls } from './ui';

interface Row {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  disabled: boolean;
  createdAt: number;
  lastSignInAt: number | null;
  role: Role | null;
  plan: string | null;
  planStatus: string | null;
  stage: string;
}
interface Detail extends Row {
  providers: string[];
  emailVerified: boolean;
  profile: { country: string | null; language: string | null; goal: string | null; timezone: string | null; onboarded: boolean };
  entitlement: { plan: string; status: string; source: string; expiresAt: number | null; trialEndsAt: number | null } | null;
  access: { stage: string; daysLeft: number; welcomeEndsAtMs: number; trialEndsAtMs: number; eligible: boolean } | null;
  activity30d: { foodLogs: number; waterLogs: number; workoutLogs: number };
  testimonials: Array<{ id: string; status: string }>;
}

function UserDetail({ uid, canEdit, onChanged, onClose }: { uid: string; canEdit: boolean; onChanged: () => void; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const [d, setD] = useState<Detail | null>(null);
  const [confirm, setConfirm] = useState(false);
  const load = useCallback(() => {
    setD(null);
    call<Detail>('adminGetUser', { uid })
      .then(setD)
      .catch((e) => toast(errorCode(e), 'error'));
  }, [uid]);
  useEffect(load, [load]);
  const rows: Array<[string, React.ReactNode]> = d
    ? [
        [t('admin.users.email'), d.email ?? '—'],
        [t('admin.users.uid'), <code key="u" className="text-caption">{d.uid}</code>],
        [t('admin.users.providers'), d.providers.join(', ') || '—'],
        [t('admin.users.created'), fmtDate(d.createdAt, i18n.language)],
        [t('admin.users.lastSignIn'), fmtDate(d.lastSignInAt, i18n.language)],
        [t('admin.users.country'), d.profile.country ?? '—'],
        [t('admin.users.language'), d.profile.language ?? '—'],
        [t('admin.users.onboarded'), d.profile.onboarded ? t('admin.yes') : t('admin.no')],
        [t('admin.users.stage'), d.access ? `${t(`admin.stages.${d.access.stage}`)}${d.access.daysLeft ? ` · ${t('admin.users.daysLeft', { count: d.access.daysLeft })}` : ''}` : '—'],
        [t('admin.users.subscription'), d.entitlement ? `${d.entitlement.plan} · ${d.entitlement.status} · ${d.entitlement.source} · ${fmtDate(d.entitlement.expiresAt, i18n.language)}` : t('admin.users.noSubscription')],
        [t('admin.users.activity'), t('admin.users.activityValue', d.activity30d)],
        [t('admin.users.testimonials'), d.testimonials.length ? d.testimonials.map((x) => x.status).join(', ') : '—'],
      ]
    : [];
  return (
    <Sheet open onClose={onClose} closeLabel={t('common.close')} title={d?.name ?? d?.email ?? t('admin.users.user')}>
      {!d ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="flex flex-col gap-4" id="admin-user-detail">
          <div className="flex items-center gap-3">
            <Avatar name={d.name ?? d.email} photoURL={d.photoURL} size={48} />
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={d.disabled ? 'accent' : 'primary'}>{d.disabled ? t('admin.users.disabled') : t('admin.users.active')}</Badge>
              {d.role && <Badge>{t(`admin.roles.${d.role}`)}</Badge>}
            </div>
          </div>
          <dl className="flex flex-col divide-y divide-line">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-2">
                <dt className="text-small text-muted">{k}</dt>
                <dd className="min-w-0 text-end text-small break-words text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          {canEdit && (
            <Button id="admin-toggle-user" variant={d.disabled ? 'primary' : 'destructive'} onClick={() => setConfirm(true)}>
              {d.disabled ? t('admin.users.reactivate') : t('admin.users.deactivate')}
            </Button>
          )}
          <Confirm
            open={confirm}
            destructive={!d.disabled}
            askReason
            title={d.disabled ? t('admin.users.reactivateTitle') : t('admin.users.deactivateTitle')}
            body={d.disabled ? t('admin.users.reactivateBody') : t('admin.users.deactivateBody')}
            confirmLabel={d.disabled ? t('admin.users.reactivate') : t('admin.users.deactivate')}
            onClose={() => setConfirm(false)}
            onConfirm={async (reason) => {
              try {
                await call('adminSetUserDisabled', { uid: d.uid, disabled: !d.disabled, reason });
                toast(d.disabled ? t('admin.users.reactivated') : t('admin.users.deactivated'), 'success');
                load();
                onChanged();
              } catch (e) {
                toast(errorCode(e), 'error');
              }
            }}
          />
        </div>
      )}
    </Sheet>
  );
}

export default function UsersPage({ role }: { role: Role }) {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'disabled' | 'staff'>('all');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const search = useCallback(
    async (pageToken?: string) => {
      setBusy(true);
      try {
        const r = await call<{ users: Row[]; nextPageToken: string | null }>('adminListUsers', { q: q.trim() || undefined, status, pageToken });
        setRows((prev) => (pageToken ? [...(prev ?? []), ...r.users] : r.users));
        setNext(r.nextPageToken);
      } catch (e) {
        toast(errorCode(e), 'error');
        setRows((prev) => prev ?? []);
      } finally {
        setBusy(false);
      }
    },
    [q, status],
  );
  useEffect(() => {
    const id = setTimeout(() => void search(), 300);
    return () => clearTimeout(id);
  }, [search]);
  return (
    <div className="flex flex-col gap-4" id="admin-users">
      <PageHeader title={t('admin.nav.users')} />
      <Card className="flex flex-col gap-3 md:flex-row">
        <input type="search" aria-label={t('admin.users.search')} placeholder={t('admin.users.search')} value={q} onChange={(e) => setQ(e.target.value)} className={inputCls} id="admin-user-search" />
        <select aria-label={t('admin.users.filter')} value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={`${inputCls} md:w-48`}>
          {(['all', 'active', 'disabled', 'staff'] as const).map((s) => (
            <option key={s} value={s}>
              {t(`admin.users.filters.${s}`)}
            </option>
          ))}
        </select>
      </Card>
      <Card>
        {!rows ? (
          <Skeleton className="h-48" />
        ) : !rows.length ? (
          <EmptyState title={t('admin.users.none')} />
        ) : (
          <Table label={t('admin.nav.users')} head={[t('admin.users.user'), t('admin.users.stage'), t('admin.users.subscription'), t('admin.users.created'), t('admin.users.status'), '']}>
            {rows.map((r) => (
              <tr key={r.uid}>
                <Td>
                  <span className="flex items-center gap-2">
                    <Avatar name={r.name ?? r.email} photoURL={r.photoURL} size={32} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{r.name ?? '—'}</span>
                      <span className="block truncate text-caption text-muted">{r.email ?? r.uid}</span>
                    </span>
                  </span>
                </Td>
                <Td>{t(`admin.stages.${r.stage}`)}</Td>
                <Td>{r.plan ? `${r.plan} · ${r.planStatus}` : '—'}</Td>
                <Td className="whitespace-nowrap text-muted">{fmtDate(r.createdAt, i18n.language)}</Td>
                <Td>
                  <Badge tone={r.disabled ? 'accent' : 'neutral'}>{r.disabled ? t('admin.users.disabled') : t('admin.users.active')}</Badge>
                  {r.role && <Badge className="ms-1">{t(`admin.roles.${r.role}`)}</Badge>}
                </Td>
                <Td>
                  <Button size="sm" variant="secondary" onClick={() => setOpen(r.uid)}>
                    {t('admin.view')}
                  </Button>
                </Td>
              </tr>
            ))}
          </Table>
        )}
        {next && (
          <Button className="mt-3" variant="secondary" loading={busy} onClick={() => void search(next)}>
            {t('admin.loadMore')}
          </Button>
        )}
      </Card>
      {open && <UserDetail uid={open} canEdit={atLeast(role, 'admin')} onChanged={() => void search()} onClose={() => setOpen(null)} />}
    </div>
  );
}
