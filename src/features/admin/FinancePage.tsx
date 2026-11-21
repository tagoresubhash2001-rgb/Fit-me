import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, Sheet, Skeleton, Tabs } from '../../components/ui';
import { downloadCsv, fmtDate, useAction } from './api';
import { Field, inputCls, Table, Td } from './ui';
import { PricesCard } from './PricingPage';

type Row = Record<string, unknown> & { id: string };
interface Receipt {
  payment: Row;
  seller: { name: string; product: string; supportEmail: string | null; gstin: string | null };
  tax: { name: string; percent: number; inclusive: boolean; net: number; tax: number; gross: number };
}

const money = (amount: unknown, currency: unknown, lang: string) => {
  try {
    return new Intl.NumberFormat(lang, { style: 'currency', currency: String(currency ?? 'INR') }).format(Number(amount ?? 0));
  } catch {
    return `${String(currency)} ${String(amount)}`;
  }
};

function ReceiptSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const r = useAction<Receipt>('finance.receipt', { id }, [id]);
  const d = r.data;
  return (
    <Sheet open onClose={onClose} closeLabel={t('common.close')} title={t('admin.finance.receipt')} footer={<Button onClick={() => window.print()}>{t('admin.finance.print')}</Button>}>
      {!d ? (
        r.error ? <p className="text-small text-danger-text">{r.error}</p> : <Skeleton className="h-40" />
      ) : (
        <div className="flex flex-col gap-2 text-small text-ink" id="receipt">
          <p className="text-body font-semibold">
            {d.seller.name} · {d.seller.product}
          </p>
          {d.seller.gstin && <p>GSTIN {d.seller.gstin}</p>}
          <p>
            {t('admin.finance.paymentId')}: {d.payment.id}
          </p>
          <p>
            {t('admin.finance.date')}: {fmtDate(d.payment.createdAt as number, i18n.language)}
          </p>
          <p>
            {t('admin.finance.product')}: {String(d.payment.product ?? '—')}
          </p>
          <hr className="border-line" />
          <p>
            {t('admin.finance.net')}: {money(d.tax.net, d.payment.currency, i18n.language)}
          </p>
          <p>
            {d.tax.name} {d.tax.percent}% {d.tax.inclusive ? `(${t('admin.finance.included')})` : ''}: {money(d.tax.tax, d.payment.currency, i18n.language)}
          </p>
          <p className="font-semibold">
            {t('admin.finance.total')}: {money(d.tax.gross, d.payment.currency, i18n.language)}
          </p>
          {d.seller.supportEmail && <p className="text-muted">{d.seller.supportEmail}</p>}
        </div>
      )}
    </Sheet>
  );
}

function Payments() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<'all' | 'verified' | 'failed' | 'refunded'>('all');
  const [country, setCountry] = useState('');
  const [receipt, setReceipt] = useState<string | null>(null);
  const c = /^[A-Z]{2}$/.test(country) ? country : null;
  const r = useAction<{ rows: Row[]; more: boolean }>('finance.payments', { status, country: c }, [status, c]);
  return (
    <Card className="flex flex-col gap-4" id="admin-payments">
      <CardHeader title={t('admin.finance.payments')} subtitle={t('admin.finance.paymentsBody')} />
      <div className="flex flex-wrap items-end gap-2">
        <Field label={t('admin.finance.status')}>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {(['all', 'verified', 'failed', 'refunded'] as const).map((s) => (
              <option key={s} value={s}>
                {t(`admin.finance.statuses.${s}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('admin.finance.country')}>
          <input className={inputCls} maxLength={2} value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} placeholder="IN" />
        </Field>
        <Button variant="secondary" disabled={!r.data?.rows.length} onClick={() => downloadCsv('fitme-payments', r.data?.rows ?? [])}>
          {t('admin.exportCsv')}
        </Button>
      </div>
      {!r.data ? (
        r.error ? <p className="text-small text-danger-text">{r.error}</p> : <Skeleton className="h-24" />
      ) : r.data.rows.length === 0 ? (
        <EmptyState title={t('admin.finance.noPayments')} description={t('admin.finance.noPaymentsBody')} />
      ) : (
        <Table head={[t('admin.finance.date'), t('admin.finance.amount'), t('admin.finance.country'), t('admin.finance.provider'), t('admin.finance.status'), '']} label={t('admin.finance.payments')}>
          {r.data.rows.map((p) => (
            <tr key={p.id}>
              <Td>{fmtDate(p.createdAt as number, i18n.language)}</Td>
              <Td className="tabular-nums">{money(p.amount, p.currency, i18n.language)}</Td>
              <Td>{String(p.country ?? '—')}</Td>
              <Td>{String(p.store ?? p.provider)}</Td>
              <Td>
                <Badge tone={p.status === 'paid' ? 'primary' : p.status === 'refunded' ? 'accent' : 'neutral'}>{String(p.status)}</Badge>
                {p.sandbox ? <span className="ms-1 text-caption text-muted">{t('admin.finance.sandbox')}</span> : null}
              </Td>
              <Td>
                <Button size="sm" variant="ghost" onClick={() => setReceipt(p.id)}>
                  {t('admin.finance.receipt')}
                </Button>
              </Td>
            </tr>
          ))}
        </Table>
      )}
      {receipt && <ReceiptSheet id={receipt} onClose={() => setReceipt(null)} />}
    </Card>
  );
}

function Webhooks() {
  const { t, i18n } = useTranslation();
  const r = useAction<{ rows: Row[] }>('finance.webhooks', {});
  return (
    <Card className="flex flex-col gap-4" id="admin-webhooks">
      <CardHeader title={t('admin.finance.webhooks')} subtitle={t('admin.finance.webhooksBody')} />
      {!r.data ? (
        r.error ? <p className="text-small text-danger-text">{r.error}</p> : <Skeleton className="h-24" />
      ) : r.data.rows.length === 0 ? (
        <EmptyState title={t('admin.finance.noWebhooks')} />
      ) : (
        <Table head={[t('admin.finance.date'), t('admin.finance.provider'), t('admin.finance.event'), t('admin.finance.applied')]} label={t('admin.finance.webhooks')}>
          {r.data.rows.map((w) => (
            <tr key={w.id}>
              <Td>{fmtDate(w.at as number, i18n.language)}</Td>
              <Td>{String(w.provider)}</Td>
              <Td>{String(w.type)}</Td>
              <Td>{w.applied ? t('admin.yes') : t('admin.no')}</Td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

export default function FinancePage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'prices' | 'payments' | 'webhooks'>('prices');
  return (
    <div className="flex flex-col gap-4" id="admin-finance">
      <PageHeader title={t('admin.nav.finance')} subtitle={t('admin.finance.subtitle')} />
      <Tabs
        value={tab}
        onChange={setTab}
        ariaLabel={t('admin.nav.finance')}
        items={[
          { id: 'prices', label: t('admin.finance.tabPrices') },
          { id: 'payments', label: t('admin.finance.tabPayments') },
          { id: 'webhooks', label: t('admin.finance.tabWebhooks') },
        ]}
      />
      {tab === 'prices' && <PricesCard />}
      {tab === 'payments' && <Payments />}
      {tab === 'webhooks' && <Webhooks />}
      <p className="text-caption text-muted">{t('admin.finance.storeNote')}</p>
    </div>
  );
}
