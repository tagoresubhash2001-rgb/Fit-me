import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, onSnapshot } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, Skeleton, toast } from '../../components/ui';
import { auth, db } from '../../lib/firebase';
import { call, errorCode, type Role } from './api';
import { ASSIGNABLE_ROLES } from '../../domain/adminRoles';
import { Confirm, Field, Table, Td, inputCls } from './ui';

interface Staff {
  uid: string;
  email: string | null;
  role: Role;
}

export function MyAccount({ role }: { role: Role }) {
  const { t } = useTranslation();
  const u = auth().currentUser;
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const hasPassword = !!u?.providerData.some((p) => p.providerId === 'password');
  return (
    <Card className="flex flex-col gap-3" id="admin-my-account">
      <CardHeader title={t('admin.admins.myAccount')} />
      <p className="text-small text-ink">
        {u?.email} · {t(`admin.roles.${role}`)}
      </p>
      <p className="text-caption text-muted">{t('admin.admins.providers', { list: u?.providerData.map((p) => p.providerId).join(', ') ?? '' })}</p>
      {hasPassword ? (
        <form
          className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!u?.email) return;
            setBusy(true);
            try {
              await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, current));
              await updatePassword(u, next);
              setCurrent('');
              setNext('');
              toast(t('admin.admins.passwordChanged'), 'success');
            } catch {
              toast(t('admin.admins.passwordFailed'), 'error');
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label={t('admin.admins.currentPassword')}>
            <input type="password" autoComplete="current-password" className={inputCls} value={current} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
          <Field label={t('admin.admins.newPassword')} hint={t('admin.admins.passwordHint')}>
            <input type="password" autoComplete="new-password" minLength={12} className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
          <Button type="submit" loading={busy} disabled={!current || next.length < 12}>
            {t('admin.admins.changePassword')}
          </Button>
        </form>
      ) : (
        <p className="text-small text-muted">{t('admin.admins.googleManaged')}</p>
      )}
      <div>
        <Button
          variant="secondary"
          onClick={() =>
            call('adminRevokeMySessions')
              .then(() => toast(t('admin.admins.sessionsRevoked'), 'success'))
              .catch((e) => toast(errorCode(e), 'error'))
          }
        >
          {t('admin.admins.revokeSessions')}
        </Button>
      </div>
    </Card>
  );
}

export default function AdminsPage({ role }: { role: Role }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Staff[] | null>(null);
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('support');
  const [remove, setRemove] = useState<Staff | null>(null);
  const [busy, setBusy] = useState(false);
  const isSuper = role === 'superAdmin';
  useEffect(() => {
    return onSnapshot(
        collection(db(), 'staff'),
        (s) => setRows(s.docs.map((d) => d.data() as Staff)),
        () => setRows([]),
      );
  }, []);
  const setRole = async (payload: { email?: string; uid?: string; role: Role | null }) => {
    setBusy(true);
    try {
      await call('adminSetRole', payload);
      toast(t('admin.admins.saved'), 'success');
    } catch (e) {
      toast(t(errorCode(e).includes('last_super_admin') ? 'admin.admins.lastSuper' : errorCode(e).includes('user_not_found') ? 'admin.admins.notFound' : 'admin.loadFailed'), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-4" id="admin-admins">
      <PageHeader title={t('admin.nav.admins')} />
      <MyAccount role={role} />
      <Card className="flex flex-col gap-3">
        <CardHeader title={t('admin.admins.team')} subtitle={isSuper ? t('admin.admins.teamHint') : t('admin.admins.onlySuper')} />
        {!rows ? (
          <Skeleton className="h-24" />
        ) : !rows.length ? (
          <EmptyState title={t('admin.empty')} />
        ) : (
          <Table label={t('admin.admins.team')} head={[t('admin.login.email'), t('admin.admins.role'), '']}>
            {rows.map((s) => (
              <tr key={s.uid}>
                <Td>{s.email ?? s.uid}</Td>
                <Td>
                  {isSuper ? (
                    <select aria-label={t('admin.admins.role')} className={inputCls} value={s.role} disabled={busy} onChange={(e) => void setRole({ uid: s.uid, role: e.target.value as Role })}>
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {t(`admin.roles.${r}`)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge>{t(`admin.roles.${s.role}`)}</Badge>
                  )}
                </Td>
                <Td>
                  {isSuper && (
                    <Button size="sm" variant="ghost" onClick={() => setRemove(s)}>
                      {t('admin.admins.remove')}
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
        {isSuper && (
          <form
            className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_auto] md:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              void setRole({ email: email.trim().toLowerCase(), role: newRole }).then(() => setEmail(''));
            }}
          >
            <Field label={t('admin.admins.addEmail')} hint={t('admin.admins.addHint')}>
              <input id="admin-add-email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label={t('admin.admins.role')}>
              <select className={inputCls} value={newRole} onChange={(e) => setNewRole(e.target.value as Role)}>
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`admin.roles.${r}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="submit" loading={busy} disabled={!email.includes('@')}>
              {t('admin.admins.add')}
            </Button>
          </form>
        )}
      </Card>
      <Confirm
        open={!!remove}
        destructive
        title={t('admin.admins.removeTitle')}
        body={t('admin.admins.removeBody', { email: remove?.email ?? '' })}
        confirmLabel={t('admin.admins.remove')}
        onClose={() => setRemove(null)}
        onConfirm={async () => {
          if (remove) await setRole({ uid: remove.uid, role: null });
        }}
      />
    </div>
  );
}
