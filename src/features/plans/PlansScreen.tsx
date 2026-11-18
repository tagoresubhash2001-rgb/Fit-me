import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { httpsCallable } from 'firebase/functions';
import { BellRing, Check, ChevronDown, Lock, Minus, ShieldCheck, Sparkles, XCircle } from 'lucide-react';
import { Badge, Button, Card, CountUp, PageHeader, Select, Sheet, Tabs, cn, toast } from '../../components/ui';
import { functions } from '../../lib/firebase';
import { useSession, type EntitlementView } from '../../data/session';
import { usePricing } from '../../data/pricing';
import { PLAN_FEATURES, formatPrice } from '../../domain/pricing';
import {
  PERIODS,
  hasAccess,
  marketFor,
  quote,
  roundToStep,
  trialEligible,
  type PaidPlan,
  type Period,
  type Quote,
} from '../../domain/billing';

const DAY = 86400000;
const KEY_FEATURES: Record<PaidPlan, string[]> = {
  premium: ['micros', 'photoScan', 'noAds', 'macros'],
  pro: ['coach', 'planner', 'generators', 'reminders', 'reports'],
};

/**
 * Plans and free trial (PRD section 2). Prices come from appConfig/pricing; the server decides whether
 * "Start free trial" starts a trial (test / live mode) or records interest while payments are launching.
 */
export default function PlansScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const pricing = usePricing();
  const profile = useSession((s) => s.profile)!;
  const plan = useSession((s) => s.plan);
  const ent = useSession((s) => s.entitlement);
  const period: Period = (PERIODS as readonly string[]).includes(params.get('period') ?? '') ? (params.get('period') as Period) : 'monthly';
  const highlight = params.get('highlight') as PaidPlan | null;
  const [summary, setSummary] = useState<Quote | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const now = Date.now();
  const market = marketFor(pricing, profile.country, profile.currency);
  const quotes = useMemo(
    () => (market ? { premium: quote(pricing, market, 'premium', period, now), pro: quote(pricing, market, 'pro', period, now) } : null),
    [pricing, market, period, now],
  );
  const subscribed = ent && hasAccess(ent, now) ? ent : null;
  const eligible = trialEligible(ent?.trialUsed ? 1 : null);
  const money = (v: number, q: Quote) => formatPrice(roundToStep(v, pricing.markets[market!].priceStep, 'down'), q.currency, i18n.language);
  const date = (ms: number) =>
    new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(ms));
  const setPeriod = (p: Period) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set('period', p);
        return n;
      },
      { replace: true },
    );

  const choose = async (p: PaidPlan) => {
    if (subscribed && changing && subscribed.source === 'test') {
      try {
        await httpsCallable(functions(), 'manageSubscription')({ action: 'change', plan: p, period });
        toast(t('plans.changed', { plan: t(`plans.${p}`) }), 'success');
        setChanging(false);
      } catch {
        toast(t('common.error'), 'error');
      }
      return;
    }
    if (quotes?.[p]) setSummary(quotes[p]);
    else
      setSummary({
        plan: p,
        period,
        currency: profile.currency,
        months: 1,
        total: 0,
        perMonth: 0,
        discount: 0,
        savingPct: 0,
        regularMonthly: null,
        offerEndsAt: null,
        lowest30d: null,
        trialDays: pricing.trialDays,
      });
  };

  const discount = (p: Period) => Math.round(pricing.periods[p].discount * 100);
  const periodItems = PERIODS.map((p) => ({
    id: p,
    ariaLabel: discount(p) ? `${t(`plans.period.${p}`)}, ${t('plans.period.save', { pct: discount(p) })}` : t(`plans.period.${p}`),
    label: (
      <span className="flex flex-col items-center leading-tight sm:flex-row sm:gap-1.5">
        <span>{t(`plans.period.${p}`)}</span>
        {discount(p) > 0 && (
          <span className="text-caption font-semibold text-primary-text">{t('plans.period.save', { pct: discount(p) })}</span>
        )}
      </span>
    ),
  }));

  return (
    <div className="stagger mx-auto flex w-full max-w-5xl flex-col gap-5">
      <PageHeader title={t('plans.title')} subtitle={t('plans.subtitle', { days: pricing.trialDays })} />

      {subscribed && (
        <CurrentPlan
          ent={subscribed}
          date={date}
          onCancel={() => setCancelOpen(true)}
          onChange={() => setChanging((c) => !c)}
          changing={changing}
        />
      )}

      {/* Billing period: segmented control; a dropdown on very narrow screens */}
      <div className="card-enter">
        <div className="hidden min-[360px]:block">
          <Tabs ariaLabel={t('plans.period.label')} value={period} onChange={setPeriod} items={periodItems} className="mx-auto max-w-xl" />
        </div>
        <div className="min-[360px]:hidden">
          <Select label={t('plans.period.label')} value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {t(`plans.period.${p}`)}
                {discount(p) ? `, ${t('plans.period.save', { pct: discount(p) })}` : ''}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {(['premium', 'pro'] as const).map((p) => (
          <PlanCard
            key={p}
            plan={p}
            q={quotes?.[p] ?? null}
            money={money}
            date={date}
            trialDays={pricing.trialDays}
            eligible={eligible}
            current={!!subscribed && subscribed.plan === p}
            highlighted={highlight === p || (!highlight && p === 'pro')}
            changing={changing}
            subscribed={!!subscribed}
            onChoose={() => void choose(p)}
          />
        ))}
      </div>

      {plan === 'free' && (
        <div className="card-enter flex flex-col items-center gap-1 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-button px-3 py-2 text-body font-semibold text-ink underline-offset-4 hover:underline"
          >
            {t('plans.continueFree')}
          </button>
          <p className="max-w-md text-small text-muted">{t('plans.freeLine')}</p>
        </div>
      )}

      <ul className="card-enter grid grid-cols-1 gap-2 rounded-card bg-raised p-4 sm:grid-cols-3" aria-label={t('plans.trust.label')}>
        {[
          [XCircle, 'plans.trust.cancel'],
          [BellRing, 'plans.trust.reminder'],
          [ShieldCheck, 'plans.trust.secure'],
        ].map(([Icon, k]) => {
          const I = Icon as typeof XCircle;
          return (
            <li key={k as string} className="flex items-center gap-2.5 text-small text-ink">
              <I className="h-5 w-5 shrink-0 text-primary-text" strokeWidth={1.75} />
              {t(k as string)}
            </li>
          );
        })}
      </ul>

      <Card className="card-enter" static padding="sm">
        <button
          type="button"
          aria-expanded={compareOpen}
          aria-controls="plans-compare"
          onClick={() => setCompareOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 rounded-button px-2 py-2 text-start"
        >
          <span className="text-title text-ink">{t('plans.compare')}</span>
          <ChevronDown
            className={cn('h-5 w-5 text-muted transition-transform duration-250', compareOpen && 'rotate-180')}
            strokeWidth={1.75}
          />
        </button>
        <div
          id="plans-compare"
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-emphasized)] motion-reduce:transition-none',
            compareOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="min-h-0 overflow-hidden" inert={!compareOpen}>
            <div className="overflow-x-auto px-2 pb-2">
              <table className="w-full border-collapse text-start">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="py-2.5 pe-4 text-start text-small font-medium text-muted">
                      {t('plans.feature')}
                    </th>
                    {(['free', 'premium', 'pro'] as const).map((p) => (
                      <th
                        key={p}
                        scope="col"
                        className={cn('w-[18%] py-2.5 text-center text-body font-semibold', plan === p ? 'text-primary-text' : 'text-ink')}
                      >
                        {t(`plans.${p}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLAN_FEATURES.map((f) => (
                    <tr key={f.id} className="border-b border-line last:border-0">
                      <th scope="row" className="py-2.5 pe-4 text-start text-body font-normal text-ink">
                        {t(`plans.features.${f.id}`)}
                      </th>
                      {(['free', 'premium', 'pro'] as const).map((p) => (
                        <td key={p} className="py-2.5 text-center">
                          {f.plans.includes(p) ? (
                            <Check className="mx-auto h-5 w-5 text-primary-text" strokeWidth={2.25} aria-hidden />
                          ) : (
                            <Minus className="mx-auto h-5 w-5 text-muted" strokeWidth={2} aria-hidden />
                          )}
                          <span className="sr-only">{f.plans.includes(p) ? t('plans.included') : t('plans.notIncluded')}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      <TrialSummarySheet q={summary} market={market} money={money} date={date} eligible={eligible} onClose={() => setSummary(null)} />
      {subscribed && <CancelSheet open={cancelOpen} ent={subscribed} date={date} onClose={() => setCancelOpen(false)} />}
    </div>
  );
}

function PlanCard({
  plan,
  q,
  money,
  date,
  trialDays,
  eligible,
  current,
  highlighted,
  changing,
  subscribed,
  onChoose,
}: {
  plan: PaidPlan;
  q: Quote | null;
  money: (v: number, q: Quote) => string;
  date: (ms: number) => string;
  trialDays: number;
  eligible: boolean;
  current: boolean;
  highlighted: boolean;
  changing: boolean;
  subscribed: boolean;
  onChoose: () => void;
}) {
  const { t } = useTranslation();
  const [all, setAll] = useState(false);
  const included = PLAN_FEATURES.filter((f) => f.plans.includes(plan)).map((f) => f.id);
  const features = all ? included : KEY_FEATURES[plan];
  const big = q ? (q.months === 1 ? q.total : q.perMonth) : null;
  const action = current
    ? null
    : subscribed
      ? changing
        ? t('plans.switchTo', { plan: t(`plans.${plan}`) })
        : null
      : eligible
        ? t('plans.startTrial', { days: trialDays })
        : t('plans.choose', { plan: t(`plans.${plan}`) });
  return (
    <Card
      id={`plan-${plan}`}
      className={cn(
        'flex flex-col gap-4',
        (highlighted || current) && 'ring-2 ring-primary',
        'xl:hover:[transform:perspective(900px)_rotateX(1deg)_translateY(-3px)]',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-title text-ink">{t(`plans.${plan}`)}</h2>
          <p className="text-small text-muted">{t(`plans.tagline.${plan}`)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {current ? (
            <Badge tone="primary">{t('plans.current')}</Badge>
          ) : (
            plan === 'pro' && <Badge tone="accent">{t('plans.mostPopular')}</Badge>
          )}
          {!subscribed && eligible && <Badge tone="primary">{t('plans.trialBadge', { days: trialDays })}</Badge>}
        </div>
      </div>

      {q && big !== null ? (
        <div className="flex flex-col gap-1" aria-live="polite">
          {q.regularMonthly !== null && (
            <p className="flex flex-wrap items-baseline gap-2 text-small">
              <s className="text-muted" aria-label={t('plans.regularPrice', { price: money(q.regularMonthly, q) })}>
                {money(q.regularMonthly, q)}
              </s>
              {q.offerEndsAt && (
                <span className="font-semibold text-accent">{t('plans.launchOffer', { date: date(Date.parse(q.offerEndsAt)) })}</span>
              )}
            </p>
          )}
          <p className="flex items-baseline gap-1.5">
            <span id={`price-${plan}`} className="text-[40px] leading-none font-semibold tracking-tight text-ink">
              <CountUp value={big} format={(v) => money(v, q)} duration={350} />
            </span>
            <span className="text-small text-muted">{t('plans.perMonthShort')}</span>
          </p>
          <p id={`billed-${plan}`} className="text-small text-muted">
            {t(`plans.billed.${q.period}`, { total: money(q.total, q), perMonth: money(q.perMonth, q) })}
          </p>
          {q.lowest30d !== null && <p className="text-caption text-muted">{t('plans.lowest30d', { price: money(q.lowest30d, q) })}</p>}
        </div>
      ) : (
        <p className="text-body text-muted">{t('plans.localPrice')}</p>
      )}

      <ul className="flex flex-col gap-2">
        {features.map((f) => (
          <li key={f} className="list-enter flex items-start gap-2 text-small text-ink">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-text" strokeWidth={2.25} aria-hidden />
            {t(`plans.features.${f}`)}
          </li>
        ))}
      </ul>
      {included.length > KEY_FEATURES[plan].length && (
        <button
          type="button"
          aria-expanded={all}
          onClick={() => setAll((a) => !a)}
          className="self-start rounded-button text-small font-semibold text-primary-text hover:underline"
        >
          {all ? t('plans.seeLess') : t('plans.seeAll')}
        </button>
      )}

      <div className="mt-auto pt-1">
        {action ? (
          <Button id={`choose-${plan}`} fullWidth icon={<Sparkles className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={onChoose}>
            {action}
          </Button>
        ) : current ? (
          <p className="text-center text-small font-semibold text-primary-text">{t('plans.yourPlan')}</p>
        ) : (
          <p className="flex items-center justify-center gap-1.5 text-center text-small text-muted">
            <Lock className="h-4 w-4" strokeWidth={1.75} />
            {t('plans.useChange')}
          </p>
        )}
      </div>
    </Card>
  );
}

function CurrentPlan({
  ent,
  date,
  onCancel,
  onChange,
  changing,
}: {
  ent: EntitlementView;
  date: (ms: number) => string;
  onCancel: () => void;
  onChange: () => void;
  changing: boolean;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const when = ent.status === 'trialing' ? ent.trialEndsAt : ent.expiresAt;
  const manage = async (action: 'resume') => {
    setBusy(true);
    try {
      const r = (await httpsCallable(functions(), 'manageSubscription')({ action })).data as { status: string; manageUrl?: string };
      if (r.manageUrl) window.open(r.manageUrl, '_blank', 'noopener');
      else toast(t('plans.resumed'), 'success');
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setBusy(false);
    }
  };
  const store = ent.source === 'appstore' || ent.source === 'playstore';
  return (
    <Card id="current-plan" className="card-enter flex flex-col gap-3 md:flex-row md:items-center md:justify-between" static>
      <div className="min-w-0">
        <p className="text-small text-muted">{t('plans.yourPlanTitle')}</p>
        <p className="text-title text-ink">{t(`plans.${ent.plan}`)}</p>
        <p id="plan-status" className="text-small text-ink">
          {when ? t(`plans.status.${ent.status}`, { date: date(when) }) : t('plans.status.noEnd')}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {store ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              window.open(
                ent.source === 'appstore'
                  ? 'https://apps.apple.com/account/subscriptions'
                  : 'https://play.google.com/store/account/subscriptions',
                '_blank',
                'noopener',
              )
            }
          >
            {t('plans.manage')}
          </Button>
        ) : ent.status === 'cancelled' ? (
          <Button id="resume-plan" size="sm" loading={busy} onClick={() => void manage('resume')}>
            {t('plans.resume')}
          </Button>
        ) : (
          <>
            <Button id="change-plan" variant="secondary" size="sm" aria-pressed={changing} onClick={onChange}>
              {t('plans.changePlan')}
            </Button>
            <Button id="cancel-plan" variant="ghost" size="sm" onClick={onCancel}>
              {t('plans.cancel')}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

/** Required before a trial (Apple, Google, consumer law): plan, period, price after the trial, first charge date, how to cancel. */
function TrialSummarySheet({
  q,
  market,
  money,
  date,
  eligible,
  onClose,
}: {
  q: Quote | null;
  market: string | null;
  money: (v: number, q: Quote) => string;
  date: (ms: number) => string;
  eligible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  if (!q) return null;
  const firstCharge = Date.now() + q.trialDays * DAY;
  const price = market && q.total > 0 ? `${money(q.total, q)} ${t(`plans.every.${q.period}`)}` : t('plans.localPrice');
  const start = async () => {
    setBusy(true);
    try {
      const r = (await httpsCallable(functions(), 'startTrial')({ plan: q.plan, period: q.period })).data as {
        status: 'trialing' | 'interest';
        trialEndsAt?: number;
      };
      if (r.status === 'trialing') {
        setDone(true);
        toast(t('plans.trialStarted', { plan: t(`plans.${q.plan}`), date: date(r.trialEndsAt ?? firstCharge) }), 'success');
        setTimeout(onClose, 900);
      } else {
        toast(t('plans.launchingSoon', { plan: t(`plans.${q.plan}`) }), 'info');
        onClose();
      }
    } catch (e) {
      const msg = String((e as Error).message);
      toast(
        msg.includes('trial_used')
          ? t('plans.error.trialUsed')
          : msg.includes('already_subscribed')
            ? t('plans.error.alreadySubscribed')
            : t('common.error'),
        'error',
      );
    } finally {
      setBusy(false);
    }
  };
  const rows: Array<[string, string]> = [
    [t('plans.summary.plan'), t(`plans.${q.plan}`)],
    [t('plans.summary.period'), t(`plans.period.${q.period}`)],
    [t('plans.summary.trial'), eligible ? t('plans.summary.trialValue', { days: q.trialDays }) : t('plans.summary.noTrial')],
    [t('plans.summary.after'), price],
    [t('plans.summary.firstCharge'), eligible ? date(firstCharge) : t('plans.summary.today')],
  ];
  return (
    <Sheet
      open
      onClose={onClose}
      closeLabel={t('common.close')}
      title={eligible ? t('plans.summary.title') : t('plans.summary.titleNoTrial')}
      footer={
        <Button
          id="confirm-trial"
          fullWidth
          loading={busy}
          disabled={done}
          icon={done ? <Check className="h-[18px] w-[18px] animate-[pop-in_250ms_var(--ease-spring)]" strokeWidth={2.5} /> : undefined}
          onClick={() => void start()}
        >
          {eligible ? t('plans.summary.confirm') : t('plans.choose', { plan: t(`plans.${q.plan}`) })}
        </Button>
      }
    >
      <dl id="trial-summary" className="flex flex-col divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-small text-muted">{k}</dt>
            <dd className="text-end text-body font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 rounded-input bg-raised p-3 text-small text-ink">{t('plans.summary.cancelHow', { date: date(firstCharge) })}</p>
    </Sheet>
  );
}

function CancelSheet({
  open,
  ent,
  date,
  onClose,
}: {
  open: boolean;
  ent: EntitlementView;
  date: (ms: number) => string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const until = ent.status === 'trialing' ? ent.trialEndsAt : ent.expiresAt;
  const plan = t(`plans.${ent.plan}`);
  const cancel = async () => {
    setBusy(true);
    try {
      const r = (await httpsCallable(functions(), 'manageSubscription')({ action: 'cancel' })).data as { manageUrl?: string };
      if (r.manageUrl) window.open(r.manageUrl, '_blank', 'noopener');
      else toast(t('plans.cancelled', { plan, date: until ? date(until) : '' }), 'success');
      onClose();
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      closeLabel={t('common.close')}
      title={t('plans.cancelSheet.title', { plan })}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button id="confirm-cancel" variant="destructive" fullWidth loading={busy} onClick={() => void cancel()}>
            {t('plans.cancelSheet.confirm')}
          </Button>
          <Button variant="secondary" fullWidth onClick={onClose}>
            {t('plans.cancelSheet.keep', { plan })}
          </Button>
        </div>
      }
    >
      <p className="text-body text-ink">{t('plans.cancelSheet.body', { plan, date: until ? date(until) : '' })}</p>
    </Sheet>
  );
}
