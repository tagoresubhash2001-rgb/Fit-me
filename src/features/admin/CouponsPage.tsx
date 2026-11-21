import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, Skeleton, toast } from '../../components/ui';
import { Coupon, PAID_PLANS, PERIODS } from '../../domain/billing';
import { act, errorCode, fmtDate, useAction } from './api';
import { Field, inputCls, Table, Td } from './ui';

type Row = Coupon & { id: string; uses?: number; updatedAt?: number };
const blank: Coupon = { code: '', active: true, kind: 'percent', value: 10, markets: [], plans: [], periods: [], maxUses: null, perUserLimit: 1, startsAt: null, endsAt: null };
const list = (v: string) => v.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
const toIso = (d: string) => (d ? new Date(`${d}T00:00:00Z`).toISOString() : null);

/** Discount codes: percent or fixed, per market / plan / period, usage limits, dates. Never deleted. */
export default function CouponsPage() {
  const { t, i18n } = useTranslation();
  const r = useAction<{ rows: Row[] }>('coupons.list', {});
  const [c, setC] = useState<Coupon>(blank);
  const [busy, setBusy] = useState(false);
  const valid = Coupon.safeParse(c);
  const save = async (coupon: Coupon) => {
    setBusy(true);
    try {
      await act('coupons.save', { coupon });
      toast(t('admin.saved'), 'success');
      setC(blank);
      r.reload();
    } catch (e) {
      toast(errorCode(e), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-4" id="admin-coupons">
      <PageHeader title={t('admin.nav.coupons')} subtitle={t('admin.coupons.subtitle')} />
      <Card className="flex flex-col gap-4">
        <CardHeader title={c.code && r.data?.rows.some((x) => x.code === c.code) ? t('admin.coupons.edit') : t('admin.coupons.new')} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label={t('admin.coupons.code')}>
            <input id="coupon-code" className={inputCls} value={c.code} maxLength={24} onChange={(e) => setC({ ...c, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })} />
          </Field>
          <Field label={t('admin.coupons.kind')}>
            <select className={inputCls} value={c.kind} onChange={(e) => setC({ ...c, kind: e.target.value as Coupon['kind'] })}>
              <option value="percent">{t('admin.coupons.percent')}</option>
              <option value="fixed">{t('admin.coupons.fixed')}</option>
            </select>
          </Field>
          <Field label={t('admin.coupons.value')}>
            <input id="coupon-value" type="number" min={1} step="any" className={inputCls} value={c.value} onChange={(e) => setC({ ...c, value: Number(e.target.value) })} />
          </Field>
          <Field label={t('admin.coupons.markets')} hint={t('admin.coupons.emptyAll')}>
            <input className={inputCls} defaultValue={c.markets.join(', ')} key={`m-${c.code}`} onBlur={(e) => setC({ ...c, markets: list(e.target.value) })} placeholder="IN, US" />
          </Field>
          <Field label={t('admin.coupons.plans')} hint={t('admin.coupons.emptyAll')}>
            <div className="flex min-h-11 flex-wrap items-center gap-3">
              {PAID_PLANS.map((p) => (
                <label key={p} className="flex items-center gap-1.5 text-small text-ink">
                  <input type="checkbox" checked={c.plans.includes(p)} onChange={(e) => setC({ ...c, plans: e.target.checked ? [...c.plans, p] : c.plans.filter((x) => x !== p) })} />
                  {t(`plans.${p}`)}
                </label>
              ))}
            </div>
          </Field>
          <Field label={t('admin.coupons.periods')} hint={t('admin.coupons.emptyAll')}>
            <div className="flex min-h-11 flex-wrap items-center gap-3">
              {PERIODS.map((p) => (
                <label key={p} className="flex items-center gap-1.5 text-small text-ink">
                  <input type="checkbox" checked={c.periods.includes(p)} onChange={(e) => setC({ ...c, periods: e.target.checked ? [...c.periods, p] : c.periods.filter((x) => x !== p) })} />
                  {t(`admin.coupons.period.${p}`)}
                </label>
              ))}
            </div>
          </Field>
          <Field label={t('admin.coupons.maxUses')} hint={t('admin.coupons.noLimit')}>
            <input type="number" min={1} className={inputCls} value={c.maxUses ?? ''} onChange={(e) => setC({ ...c, maxUses: e.target.value ? Number(e.target.value) : null })} />
          </Field>
          <Field label={t('admin.coupons.starts')}>
            <input type="date" className={inputCls} value={c.startsAt?.slice(0, 10) ?? ''} onChange={(e) => setC({ ...c, startsAt: toIso(e.target.value) })} />
          </Field>
          <Field label={t('admin.coupons.ends')}>
            <input type="date" className={inputCls} value={c.endsAt?.slice(0, 10) ?? ''} onChange={(e) => setC({ ...c, endsAt: toIso(e.target.value) })} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button id="coupon-save" loading={busy} disabled={!valid.success} onClick={() => void save(c)}>
            {t('admin.save')}
          </Button>
          <Button variant="ghost" onClick={() => setC(blank)}>
            {t('admin.coupons.clear')}
          </Button>
        </div>
        <p className="text-caption text-muted">{t('admin.coupons.storeNote')}</p>
      </Card>
      <Card className="flex flex-col gap-3">
        <CardHeader title={t('admin.coupons.all')} />
        {!r.data ? (
          r.error ? <p className="text-small text-danger-text">{r.error}</p> : <Skeleton className="h-24" />
        ) : r.data.rows.length === 0 ? (
          <EmptyState title={t('admin.coupons.none')} />
        ) : (
          <Table head={[t('admin.coupons.code'), t('admin.coupons.value'), t('admin.coupons.uses'), t('admin.coupons.ends'), t('admin.finance.status'), '']} label={t('admin.coupons.all')}>
            {r.data.rows.map((x) => (
              <tr key={x.code}>
                <Td className="font-semibold">{x.code}</Td>
                <Td>{x.kind === 'percent' ? `${x.value}%` : x.value}</Td>
                <Td className="tabular-nums">
                  {x.uses ?? 0}
                  {x.maxUses ? ` / ${x.maxUses}` : ''}
                </Td>
                <Td>{x.endsAt ? fmtDate(Date.parse(x.endsAt), i18n.language) : '—'}</Td>
                <Td>
                  <Badge tone={x.active ? 'primary' : 'neutral'}>{x.active ? t('admin.active') : t('admin.inactive')}</Badge>
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setC(Coupon.parse(x))}>
                      {t('admin.edit')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void save({ ...Coupon.parse(x), active: !x.active })}>
                      {x.active ? t('admin.deactivate') : t('admin.activate')}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
