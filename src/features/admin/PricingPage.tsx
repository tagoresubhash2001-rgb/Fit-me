import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { Button, Card, CardHeader, PageHeader, Skeleton, toast } from '../../components/ui';
import { db } from '../../lib/firebase';
import { DEFAULT_PRICING, PricingConfig } from '../../domain/billing';
import { AccessConfig, DEFAULT_ACCESS } from '../../domain/access';
import { call, errorCode } from './api';
import { Confirm, Field, inputCls } from './ui';

interface PlanEntry {
  id: 'premium' | 'pro';
  active: boolean;
  name: Record<string, string>;
  description: Record<string, string>;
  benefits: Record<string, string[]>;
}

const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

function AccessCard() {
  const { t } = useTranslation();
  const [cfg, setCfg] = useState<AccessConfig | null>(null);
  const [apply, setApply] = useState(false);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    getDoc(doc(db(), 'appConfig/access'))
      .then((s) => setCfg(AccessConfig.safeParse(s.data()).data ?? DEFAULT_ACCESS))
      .catch(() => setCfg(DEFAULT_ACCESS));
  }, []);
  if (!cfg) return <Skeleton className="h-40" />;
  const set = (patch: Partial<AccessConfig>) => setCfg({ ...cfg, ...patch });
  return (
    <Card className="flex flex-col gap-4" id="admin-access">
      <CardHeader title={t('admin.pricing.accessTitle')} subtitle={t('admin.pricing.accessBody')} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Field label={t('admin.pricing.welcomeDays')}>
          <input type="number" min={0} max={90} className={inputCls} value={cfg.welcomeDays} onChange={(e) => set({ welcomeDays: Number(e.target.value) })} />
        </Field>
        <Field label={t('admin.pricing.welcomePlan')}>
          <select className={inputCls} value={cfg.welcomePlan} onChange={(e) => set({ welcomePlan: e.target.value as 'premium' | 'pro' })}>
            <option value="pro">{t('plans.pro')}</option>
            <option value="premium">{t('plans.premium')}</option>
          </select>
        </Field>
        <Field label={t('admin.pricing.trialDays')}>
          <input type="number" min={0} max={365} className={inputCls} value={cfg.trialDays} onChange={(e) => set({ trialDays: Number(e.target.value) })} />
        </Field>
        <Field label={t('admin.pricing.trialPlan')}>
          <select className={inputCls} value={cfg.trialPlan} onChange={(e) => set({ trialPlan: e.target.value as 'premium' | 'pro' })}>
            <option value="premium">{t('plans.premium')}</option>
            <option value="pro">{t('plans.pro')}</option>
          </select>
        </Field>
      </div>
      <label className="flex items-start gap-3 text-small text-ink">
        <input type="checkbox" checked={apply} onChange={(e) => setApply(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[var(--primary)]" />
        <span>{t('admin.pricing.applyExisting')}</span>
      </label>
      <div>
        <Button id="save-access" onClick={() => setConfirm(true)}>
          {t('admin.save')}
        </Button>
      </div>
      <Confirm
        open={confirm}
        title={t('admin.pricing.accessConfirmTitle')}
        body={apply ? t('admin.pricing.accessConfirmExisting') : t('admin.pricing.accessConfirmNew')}
        confirmLabel={t('admin.save')}
        onClose={() => setConfirm(false)}
        onConfirm={async () => {
          try {
            const r = await call<{ version: number; updatedUsers: number }>('adminSaveAccess', { welcomeDays: cfg.welcomeDays, trialDays: cfg.trialDays, welcomePlan: cfg.welcomePlan, trialPlan: cfg.trialPlan, applyToExisting: apply });
            toast(t('admin.pricing.accessSaved', { version: r.version, count: r.updatedUsers }), 'success');
          } catch (e) {
            toast(errorCode(e), 'error');
          }
        }}
      />
    </Card>
  );
}

function PricesCard() {
  const { t } = useTranslation();
  const [cfg, setCfg] = useState<PricingConfig | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    getDoc(doc(db(), 'appConfig/pricing'))
      .then((s) => setCfg(PricingConfig.safeParse(s.data()).data ?? DEFAULT_PRICING))
      .catch(() => setCfg(DEFAULT_PRICING));
  }, []);
  if (!cfg) return <Skeleton className="h-64" />;
  const market = (key: string, patch: Partial<PricingConfig['markets'][string]>) => setCfg({ ...cfg, markets: { ...cfg.markets, [key]: { ...cfg.markets[key], ...patch } } });
  const price = (key: string, plan: 'premium' | 'pro', field: 'regular' | 'offer' | 'lowest30d', v: string) => {
    const m = cfg.markets[key];
    market(key, { plans: { ...m.plans, [plan]: { ...m.plans[plan], [field]: field === 'offer' ? Number(v) : numOrNull(v) } } });
  };
  const valid = PricingConfig.safeParse(cfg);
  return (
    <Card className="flex flex-col gap-5" id="admin-prices">
      <CardHeader title={t('admin.pricing.pricesTitle')} subtitle={t('admin.pricing.pricesBody')} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label={t('admin.pricing.quarterlyDiscount')}>
          <input type="number" min={0} max={90} className={inputCls} value={Math.round(cfg.periods.quarterly.discount * 100)} onChange={(e) => setCfg({ ...cfg, periods: { ...cfg.periods, quarterly: { months: 3, discount: Number(e.target.value) / 100 } } })} />
        </Field>
        <Field label={t('admin.pricing.yearlyDiscount')}>
          <input type="number" min={0} max={90} className={inputCls} value={Math.round(cfg.periods.yearly.discount * 100)} onChange={(e) => setCfg({ ...cfg, periods: { ...cfg.periods, yearly: { months: 12, discount: Number(e.target.value) / 100 } } })} />
        </Field>
        <Field label={t('admin.pricing.rounding')}>
          <select className={inputCls} value={cfg.rounding} onChange={(e) => setCfg({ ...cfg, rounding: e.target.value as 'down' | 'nearest' })}>
            <option value="nearest">{t('admin.pricing.roundNearest')}</option>
            <option value="down">{t('admin.pricing.roundDown')}</option>
          </select>
        </Field>
      </div>
      {Object.entries(cfg.markets).map(([key, m]) => (
        <fieldset key={key} className="flex flex-col gap-3 rounded-input border border-line p-3" id={`market-${key}`}>
          <legend className="px-1 text-small font-semibold text-ink">
            {key} · {m.currency}
          </legend>
          <Field label={t('admin.pricing.offerEnds')} hint={t('admin.pricing.offerEndsHint')}>
            <input
              type="date"
              className={inputCls}
              value={m.offerEndsAt ? m.offerEndsAt.slice(0, 10) : ''}
              onChange={(e) => market(key, { offerEndsAt: e.target.value ? new Date(`${e.target.value}T23:59:59Z`).toISOString() : null })}
            />
          </Field>
          {(['premium', 'pro'] as const).map((plan) => (
            <div key={plan} className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <p className="col-span-2 text-small font-medium text-ink md:col-span-1 md:self-center">{t(`plans.${plan}`)}</p>
              <Field label={t('admin.pricing.offer')}>
                <input type="number" min={0} step="any" className={inputCls} value={m.plans[plan].offer} onChange={(e) => price(key, plan, 'offer', e.target.value)} />
              </Field>
              <Field label={t('admin.pricing.regular')}>
                <input type="number" min={0} step="any" className={inputCls} value={m.plans[plan].regular ?? ''} onChange={(e) => price(key, plan, 'regular', e.target.value)} />
              </Field>
              {m.eu && (
                <Field label={t('admin.pricing.lowest30d')}>
                  <input type="number" min={0} step="any" className={inputCls} value={m.plans[plan].lowest30d ?? ''} onChange={(e) => price(key, plan, 'lowest30d', e.target.value)} />
                </Field>
              )}
            </div>
          ))}
        </fieldset>
      ))}
      {!valid.success && <p className="text-small text-danger-text">{t('admin.pricing.invalid')}</p>}
      <p className="text-caption text-muted">{t('admin.pricing.safety')}</p>
      <div>
        <Button id="save-prices" disabled={!valid.success} onClick={() => setConfirm(true)}>
          {t('admin.save')}
        </Button>
      </div>
      <Confirm
        open={confirm}
        title={t('admin.pricing.pricesConfirmTitle')}
        body={t('admin.pricing.pricesConfirmBody')}
        confirmLabel={t('admin.save')}
        onClose={() => setConfirm(false)}
        onConfirm={async () => {
          try {
            const r = await call<{ version: number }>('adminSavePricing', { config: cfg });
            toast(t('admin.savedVersion', { version: r.version }), 'success');
          } catch (e) {
            toast(errorCode(e), 'error');
          }
        }}
      />
    </Card>
  );
}

function PlansCard() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<PlanEntry[] | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getDoc(doc(db(), 'appConfig/plans'))
      .then((s) => {
        const stored = (s.get('plans') as PlanEntry[] | undefined) ?? [];
        setPlans((['premium', 'pro'] as const).map((id) => stored.find((p) => p.id === id) ?? { id, active: true, name: {}, description: {}, benefits: {} }));
      })
      .catch(() => setPlans([]));
  }, []);
  if (!plans) return <Skeleton className="h-40" />;
  const up = (id: string, patch: Partial<PlanEntry>) => setPlans(plans.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  return (
    <Card className="flex flex-col gap-4" id="admin-plans">
      <CardHeader title={t('admin.pricing.plansTitle')} subtitle={t('admin.pricing.plansBody')} />
      {plans.map((p) => (
        <fieldset key={p.id} className="flex flex-col gap-3 rounded-input border border-line p-3">
          <legend className="px-1 text-small font-semibold text-ink">{t(`plans.${p.id}`)}</legend>
          <label className="flex items-center gap-3 text-small text-ink">
            <input type="checkbox" checked={p.active} onChange={(e) => up(p.id, { active: e.target.checked })} className="h-5 w-5 accent-[var(--primary)]" />
            {t('admin.pricing.offered')}
          </label>
          <Field label={t('admin.pricing.displayName')} hint={t('admin.pricing.blankDefault')}>
            <input className={inputCls} maxLength={40} value={p.name.en ?? ''} onChange={(e) => up(p.id, { name: { ...p.name, en: e.target.value } })} />
          </Field>
          <Field label={t('admin.pricing.description')} hint={t('admin.pricing.blankDefault')}>
            <input className={inputCls} maxLength={200} value={p.description.en ?? ''} onChange={(e) => up(p.id, { description: { ...p.description, en: e.target.value } })} />
          </Field>
          <Field label={t('admin.pricing.benefits')} hint={t('admin.pricing.benefitsHint')}>
            <textarea
              rows={4}
              className="w-full rounded-input border border-line bg-surface px-3 py-2 text-body text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={(p.benefits.en ?? []).join('\n')}
              onChange={(e) => up(p.id, { benefits: { ...p.benefits, en: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 10) } })}
            />
          </Field>
        </fieldset>
      ))}
      <div>
        <Button
          id="save-plans"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const clean = plans.map((p) => ({ ...p, name: Object.fromEntries(Object.entries(p.name).filter(([, v]) => v.trim())), description: Object.fromEntries(Object.entries(p.description).filter(([, v]) => v.trim())) }));
              const r = await call<{ version: number }>('adminSavePlans', { config: { plans: clean } });
              toast(t('admin.savedVersion', { version: r.version }), 'success');
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
    </Card>
  );
}

export default function PricingPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4" id="admin-pricing">
      <PageHeader title={t('admin.nav.pricing')} />
      <AccessCard />
      <PricesCard />
      <PlansCard />
    </div>
  );
}
