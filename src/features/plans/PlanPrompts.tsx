import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CircleArrowUp, Clock, X } from 'lucide-react';
import { Button, IconButton } from '../../components/ui';
import { useSession } from '../../data/session';
import { stageAt, stageReminderDue } from '../../domain/access';
import { useFeatures } from '../../data/appConfig';

const DAY = 86400000;
const SESSION_KEY = 'fit_me_nudge_session';
const SNOOZE_KEY = 'fit_me_nudge_snooze';
const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

/** In-app reminder in the last three days of a trial (the server also sends a push). */
export function TrialEndingBanner() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const ent = useSession((s) => s.entitlement);
  const [hidden, setHidden] = useState(false);
  const end = ent?.status === 'trialing' ? ent.trialEndsAt : null;
  if (hidden || !end || end - Date.now() > 3 * DAY || end < Date.now()) return null;
  return (
    <div role="status" id="trial-ending" className="card-enter mx-4 mt-3 flex items-center gap-3 rounded-card border border-card-border bg-accent-subtle p-3 md:mx-6 xl:mx-8">
      <Clock className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.75} />
      <p className="min-w-0 flex-1 text-small text-ink">{t('plans.trialEnding', { date: new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long' }).format(new Date(end)) })}</p>
      <Button size="sm" variant="secondary" onClick={() => navigate('/plans')}>
        {t('plans.manage')}
      </Button>
      <IconButton label={t('common.close')} onClick={() => setHidden(true)}>
        <X className="h-4 w-4" strokeWidth={1.75} />
      </IconButton>
    </div>
  );
}

/**
 * Gentle prompt for free users who have used the app for at least three days. Shown at most once per
 * session and not again for a week after "Not now". No countdowns, no scarcity.
 */
export function UpgradeNudge() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const plan = useSession((s) => s.plan);
  const ent = useSession((s) => s.entitlement);
  const profile = useSession((s) => s.profile);
  const since = profile?.onboardedAt && typeof (profile.onboardedAt as { toMillis?: () => number }).toMillis === 'function' ? (profile.onboardedAt as { toMillis: () => number }).toMillis() : null;
  const [show] = useState(() => {
    if (plan !== 'free' || ent?.trialUsed || !since || Date.now() - since < 3 * DAY) return false;
    if (safe(() => sessionStorage.getItem(SESSION_KEY), null)) return false;
    if (Number(safe(() => localStorage.getItem(SNOOZE_KEY), '0')) > Date.now()) return false;
    safe(() => sessionStorage.setItem(SESSION_KEY, '1'), undefined);
    return true;
  });
  const [open, setOpen] = useState(show);
  const enabled = useFeatures().upgradePrompt;
  if (!open || !enabled) return null;
  const dismiss = () => {
    safe(() => localStorage.setItem(SNOOZE_KEY, String(Date.now() + 7 * DAY)), undefined);
    setOpen(false);
  };
  return (
    <aside id="upgrade-nudge" aria-label={t('plans.nudgeTitle')} className="card-enter flex items-start gap-3 rounded-card border border-card-border bg-sage p-4 md:col-span-12">
      <CircleArrowUp className="mt-0.5 h-5 w-5 shrink-0 text-primary-text" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-ink">{t('plans.nudgeTitle')}</p>
        <p className="text-small text-ink">{t('plans.nudgeBody')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => navigate('/plans?highlight=pro')}>
            {t('plans.nudgeCta')}
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss}>
            {t('plans.nudgeDismiss')}
          </Button>
        </div>
      </div>
    </aside>
  );
}

/** In-app reminder 3 days and 1 day before a free stage ends (the server also sends a push when enabled). */
export function StageEndingBanner() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const access = useSession((s) => s.access);
  const subscription = useSession((s) => s.subscriptionPlan);
  const info = stageAt(access, Date.now());
  const due = stageReminderDue(info);
  const key = due ? `fit_me_stage_banner_${due.key}` : '';
  const [hidden, setHidden] = useState(() => !!key && safe(() => localStorage.getItem(key) === '1', false));
  if (!due || hidden || subscription !== 'free' || info.endsAtMs === null) return null;
  const when = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long' }).format(new Date(info.endsAtMs));
  return (
    <div role="status" id="stage-ending" className="card-enter mx-4 mt-3 flex items-center gap-3 rounded-card border border-card-border bg-accent-subtle p-3 md:mx-6 xl:mx-8">
      <Clock className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.75} />
      <p className="min-w-0 flex-1 text-small text-ink">{t(`access.ending.${info.stage}`, { count: due.daysLeft, date: when })}</p>
      <Button size="sm" variant="secondary" onClick={() => navigate('/plans')}>
        {t('access.seePlans')}
      </Button>
      <IconButton
        label={t('common.close')}
        onClick={() => {
          safe(() => localStorage.setItem(key, '1'), undefined);
          setHidden(true);
        }}
      >
        <X className="h-4 w-4" strokeWidth={1.75} />
      </IconButton>
    </div>
  );
}

/** Current free stage, days left and what happens next. Calm, no countdown clock. */
export function AccessStageCard({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const access = useSession((s) => s.access);
  const subscription = useSession((s) => s.subscriptionPlan);
  if (!access) return null;
  const info = stageAt(access, Date.now());
  if (info.stage === 'ended' && subscription !== 'free') return null;
  const fmt = (ms: number) => new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long' }).format(new Date(ms));
  const plan = t(`plans.${info.plan}`);
  return (
    <section id="access-stage" aria-label={t('access.title')} className="card-enter flex flex-col gap-2 rounded-card border border-card-border bg-surface p-4 shadow-card md:col-span-12">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-body font-semibold text-ink">{t(`access.stage.${info.stage}`)}</h2>
        {info.stage !== 'ended' && <span className="text-small font-semibold text-primary-text tabular-nums">{t('access.daysLeft', { count: info.daysLeft })}</span>}
      </div>
      <p className="text-small text-ink">
        {info.stage === 'welcome'
          ? t('access.welcomeBody', { date: fmt(info.endsAtMs!) })
          : info.stage === 'trial'
            ? t('access.trialBody', { plan, date: fmt(info.endsAtMs!) })
            : t(access.eligible ? 'access.endedBody' : 'access.notEligibleBody')}
      </p>
      {!compact && info.next && info.stage === 'welcome' && (
        <p className="text-small text-muted">{t('access.thenTrial', { plan: t(`plans.${access.trialPlan}`), date: fmt(access.trialEndsAtMs) })}</p>
      )}
      {!compact && info.stage === 'trial' && <p className="text-small text-muted">{t('access.thenFree', { date: fmt(info.endsAtMs!) })}</p>}
      {subscription === 'free' && (
        <div>
          <Button size="sm" variant={info.stage === 'ended' ? 'primary' : 'secondary'} onClick={() => navigate('/plans')}>
            {t('access.seePlans')}
          </Button>
        </div>
      )}
    </section>
  );
}
