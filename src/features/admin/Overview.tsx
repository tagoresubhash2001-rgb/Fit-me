import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, EmptyState, PageHeader, Skeleton } from '../../components/ui';
import { call, errorCode, fmtDate } from './api';

interface OverviewData {
  totalUsers: number;
  authAccounts: number;
  activeUsers30d: number;
  deactivatedUsers: number;
  stages: { welcome: number; trial: number; ended: number; notEligible: number };
  subscriptions: { total: number; paid: number };
  revenue: Record<string, number> | null;
  testimonials: { pending: number; approved: number };
  recentRegistrations: Array<{ uid: string; email: string | null; createdAt: number }>;
  recentActivity: Array<{ id: string; action: string; actorEmail: string | null; targetType: string; targetId: string; at: number | null }>;
}

function Stat({ label, value, id }: { label: string; value: React.ReactNode; id?: string }) {
  return (
    <Card padding="sm" className="flex flex-col gap-1" id={id}>
      <span className="text-caption text-muted">{label}</span>
      <span className="text-title text-ink tabular-nums">{value}</span>
    </Card>
  );
}

export default function Overview() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    call<OverviewData>('adminOverview')
      .then(setData)
      .catch((e) => setError(errorCode(e)));
  }, []);
  const n = (v: number) => new Intl.NumberFormat(i18n.language).format(v);
  if (error) return <EmptyState title={t('admin.loadFailed')} description={error} />;
  if (!data) return <Skeleton className="h-64" />;
  return (
    <div className="flex flex-col gap-6" id="admin-overview">
      <PageHeader title={t('admin.nav.overview')} />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat id="stat-users" label={t('admin.stats.totalUsers')} value={n(data.totalUsers)} />
        <Stat label={t('admin.stats.active30d')} value={n(data.activeUsers30d)} />
        <Stat label={t('admin.stats.deactivated')} value={n(data.deactivatedUsers)} />
        <Stat label={t('admin.stats.authAccounts')} value={n(data.authAccounts)} />
        <Stat label={t('admin.stats.welcome')} value={n(data.stages.welcome)} />
        <Stat label={t('admin.stats.trial')} value={n(data.stages.trial)} />
        <Stat label={t('admin.stats.ended')} value={n(data.stages.ended)} />
        <Stat label={t('admin.stats.notEligible')} value={n(data.stages.notEligible)} />
        <Stat label={t('admin.stats.subscriptions')} value={n(data.subscriptions.total)} />
        <Stat label={t('admin.stats.paidSubscriptions')} value={n(data.subscriptions.paid)} />
        <Stat label={t('admin.stats.pendingTestimonials')} value={n(data.testimonials.pending)} />
        <Stat label={t('admin.stats.approvedTestimonials')} value={n(data.testimonials.approved)} />
      </section>
      <Card>
        <CardHeader title={t('admin.stats.revenue')} />
        {data.revenue ? (
          <ul className="flex flex-wrap gap-4">
            {Object.entries(data.revenue).map(([cur, v]) => (
              <li key={cur} className="text-title text-ink tabular-nums">
                {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: cur }).format(v)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-small text-muted" id="revenue-empty">
            {t('admin.stats.noRevenue')}
          </p>
        )}
      </Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('admin.stats.recentRegistrations')} />
          {data.recentRegistrations.length ? (
            <ul className="flex flex-col divide-y divide-line">
              {data.recentRegistrations.map((r) => (
                <li key={r.uid} className="flex items-center justify-between gap-3 py-2 text-small">
                  <span className="min-w-0 truncate text-ink">{r.email ?? r.uid}</span>
                  <span className="shrink-0 text-muted">{fmtDate(r.createdAt, i18n.language)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-small text-muted">{t('admin.empty')}</p>
          )}
        </Card>
        <Card>
          <CardHeader title={t('admin.stats.recentActivity')} />
          {data.recentActivity.length ? (
            <ul className="flex flex-col divide-y divide-line">
              {data.recentActivity.map((r) => (
                <li key={r.id} className="flex flex-col py-2 text-small">
                  <span className="text-ink">{r.action}</span>
                  <span className="text-caption text-muted">
                    {r.actorEmail ?? '—'} · {fmtDate(r.at, i18n.language)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-small text-muted">{t('admin.empty')}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
