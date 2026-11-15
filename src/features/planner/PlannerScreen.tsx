import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Lock } from 'lucide-react';
import { Card, EmptyState, Badge } from '../../components/ui';
import { useSession } from '../../data/session';

/**
 * Planner is a Pro feature (PRD section 2, module 8) and is built in Phase 4.
 * Until then this screen explains the feature; it shows no sample or fake schedule.
 */
export default function PlannerScreen() {
  const { t } = useTranslation();
  const plan = useSession((s) => s.plan);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-display text-ink">{t('planner.title')}</h1>
        <Badge tone="accent">{t('plans.pro')}</Badge>
      </div>
      <Card>
        <EmptyState
          icon={plan === 'pro' ? <CalendarDays className="h-6 w-6" strokeWidth={1.75} /> : <Lock className="h-6 w-6" strokeWidth={1.75} />}
          title={t('planner.lockedTitle')}
          description={t('planner.lockedBody')}
        />
        <p className="text-center text-caption text-muted">{t('plans.paywallSoon')}</p>
      </Card>
    </div>
  );
}
