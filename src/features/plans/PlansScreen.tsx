import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { Check, Minus, Sparkles } from 'lucide-react';
import { Badge, Button, Card, cn, toast } from '../../components/ui';
import { db } from '../../lib/firebase';
import { useSession } from '../../data/session';
import { PLAN_FEATURES, formatPrice, monthlyPrice } from '../../domain/pricing';
import type { Plan } from '../../domain/plans';

const PLANS: Plan[] = ['free', 'premium', 'pro'];

/**
 * Plans and upgrade (owner correction 6, PRD sections 2 and 3). Payments (RevenueCat / Cashfree) are
 * Phase 2: until then the buttons record the user's interest in Firestore and say payments launch soon.
 */
export default function PlansScreen() {
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const highlight = params.get('highlight') as Plan | null;
  const user = useSession((s) => s.user)!;
  const profile = useSession((s) => s.profile)!;
  const current = useSession((s) => s.plan);
  const [interest, setInterest] = useState<Plan | null>(null);
  const [busy, setBusy] = useState<Plan | null>(null);
  useEffect(() => onSnapshot(doc(db(), `planInterest/${user.uid}`), (s) => setInterest((s.get('plan') as Plan) ?? null), () => setInterest(null)), [user.uid]);

  const price = (p: Plan) => {
    if (p === 'free') return t('plans.freePrice');
    const amount = monthlyPrice(profile.currency, p);
    return amount === null ? t('plans.localPrice') : t('plans.perMonth', { price: formatPrice(amount, profile.currency, i18n.language) });
  };

  const choose = async (p: Exclude<Plan, 'free'>) => {
    setBusy(p);
    try {
      await setDoc(doc(db(), `planInterest/${user.uid}`), { uid: user.uid, plan: p, currency: profile.currency, country: profile.country, updatedAt: serverTimestamp() });
      toast(t('plans.launchingSoon', { plan: t(`plans.${p}`) }), 'info');
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="stagger flex flex-col gap-4">
      <div className="card-enter">
        <h1 className="text-display text-ink">{t('plans.title')}</h1>
        <p className="text-body text-muted">{t('plans.subtitle')}</p>
        <p className="mt-2 inline-flex rounded-full bg-raised px-3 py-1 text-caption text-muted">{t('plans.billedMonthly')}</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = current === p;
          const isHighlight = highlight === p || (!highlight && p === 'pro');
          return (
            <Card key={p} id={`plan-${p}`} className={cn('flex flex-col gap-3', isHighlight && 'ring-2 ring-primary')}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-title text-ink">{t(`plans.${p}`)}</h2>
                  <p className="text-small text-muted">{t(`plans.tagline.${p}`)}</p>
                </div>
                {isCurrent ? <Badge tone="primary">{t('plans.current')}</Badge> : p === 'pro' ? <Badge tone="accent">{t('plans.mostPopular')}</Badge> : null}
              </div>
              <p className="text-display text-ink tabular-nums">{price(p)}</p>
              <ul className="flex flex-col gap-2">
                {PLAN_FEATURES.map((f) => {
                  const on = f.plans.includes(p);
                  return (
                    <li key={f.id} className={cn('flex items-start gap-2 text-small', on ? 'text-ink' : 'text-muted')}>
                      {on ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.25} /> : <Minus className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />}
                      <span className={on ? undefined : 'line-through decoration-line'}>{t(`plans.features.${f.id}`)}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-auto pt-2">
                {p === 'free' ? (
                  <Button variant="secondary" fullWidth disabled>
                    {isCurrent ? t('plans.yourPlan') : t('plans.included')}
                  </Button>
                ) : isCurrent ? (
                  <Button variant="secondary" fullWidth disabled>
                    {t('plans.yourPlan')}
                  </Button>
                ) : (
                  <Button id={`choose-${p}`} fullWidth loading={busy === p} icon={<Sparkles className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={() => void choose(p)}>
                    {interest === p ? t('plans.onList') : t('plans.choose', { plan: t(`plans.${p}`) })}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <Card tone="subtle" className="card-enter">
        <p className="text-small text-ink">{t('plans.paymentsNote')}</p>
        {interest && <p className="mt-1 text-small text-primary">{t('plans.interestSaved', { plan: t(`plans.${interest}`) })}</p>}
      </Card>
    </div>
  );
}
