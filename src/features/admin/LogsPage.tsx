import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, limit, orderBy, query, startAfter, where, type QueryDocumentSnapshot } from 'firebase/firestore';
import { Button, Card, EmptyState, PageHeader, Skeleton } from '../../components/ui';
import { db } from '../../lib/firebase';
import { fmtDate } from './api';
import { Table, Td, inputCls } from './ui';

interface Log {
  id: string;
  action: string;
  actorEmail: string | null;
  actorRole: string;
  targetType: string;
  targetId: string;
  before: unknown;
  after: unknown;
  note: string | null;
  at: { toMillis(): number } | null;
}
const PAGE = 50;

/** Immutable activity log (read-only for staff; written only by Cloud Functions). */
export default function LogsPage() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState<Log[] | null>(null);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [more, setMore] = useState(false);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(
    async (after: QueryDocumentSnapshot | null) => {
      const base = collection(db(), 'adminLogs');
      const q = filter.trim()
        ? query(base, where('targetType', '==', filter.trim()), orderBy('at', 'desc'), ...(after ? [startAfter(after)] : []), limit(PAGE))
        : query(base, orderBy('at', 'desc'), ...(after ? [startAfter(after)] : []), limit(PAGE));
      const snap = await getDocs(q);
      const page = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Log, 'id'>) }));
      setRows((r) => (after ? [...(r ?? []), ...page] : page));
      setCursor(snap.docs[snap.docs.length - 1] ?? null);
      setMore(snap.size === PAGE);
    },
    [filter],
  );
  useEffect(() => {
    setRows(null);
    void load(null).catch(() => setRows([]));
  }, [load]);
  return (
    <div className="flex flex-col gap-4" id="admin-logs">
      <PageHeader
        title={t('admin.nav.logs')}
        actions={
          <select aria-label={t('admin.logs.filter')} value={filter} onChange={(e) => setFilter(e.target.value)} className={inputCls}>
            <option value="">{t('admin.logs.all')}</option>
            {['user', 'testimonial', 'appConfig', 'food', 'foodSuggestion'].map((x) => (
              <option key={x} value={x}>
                {t(`admin.logs.types.${x}`)}
              </option>
            ))}
          </select>
        }
      />
      <Card>
        {!rows ? (
          <Skeleton className="h-40" />
        ) : !rows.length ? (
          <EmptyState title={t('admin.logs.empty')} />
        ) : (
          <Table label={t('admin.nav.logs')} head={[t('admin.logs.when'), t('admin.logs.who'), t('admin.logs.action'), t('admin.logs.target'), '']}>
            {rows.map((r) => (
              <React.Fragment key={r.id}>
                <tr>
                  <Td className="whitespace-nowrap text-muted">{fmtDate(r.at?.toMillis?.() ?? null, i18n.language)}</Td>
                  <Td>
                    {r.actorEmail ?? '—'} <span className="text-caption text-muted">({r.actorRole})</span>
                  </Td>
                  <Td>{r.action}</Td>
                  <Td className="max-w-[14rem] truncate">
                    {r.targetType} · {r.targetId}
                  </Td>
                  <Td>
                    <Button size="sm" variant="ghost" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>
                      {t('admin.logs.details')}
                    </Button>
                  </Td>
                </tr>
                {open === r.id && (
                  <tr>
                    <td colSpan={5} className="bg-raised px-2 py-2">
                      {r.note && <p className="mb-2 text-small text-ink">{r.note}</p>}
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {(['before', 'after'] as const).map((k) => (
                          <div key={k}>
                            <p className="text-caption font-semibold text-muted">{t(`admin.logs.${k}`)}</p>
                            <pre className="max-h-64 overflow-auto rounded-input bg-surface p-2 text-caption whitespace-pre-wrap text-ink">{JSON.stringify(r[k], null, 2)}</pre>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </Table>
        )}
        {more && (
          <Button className="mt-3" variant="secondary" onClick={() => void load(cursor)}>
            {t('admin.loadMore')}
          </Button>
        )}
      </Card>
    </div>
  );
}
