import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, PlanBadge } from '../../components/ui';
import { useSession } from '../../data/session';

/**
 * Planner is a Pro feature (PRD section 2, module 8) and is built in Phase 4.
 * Until then this screen explains the feature; it shows no sample or fake schedule.
 */
export default function PlannerScreen() {
  const { t } = useTranslation();
  const plan = useSession((s) => s.plan);
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-display text-ink">{t('planner.title')}</h1>
        <PlanBadge plan="pro" label={t('plans.pro')} ariaLabel={t('plans.seePlans')} />
      </div>
      <Card>
        <EmptyState
          icon={plan === 'pro' ? <CalendarDays className="h-6 w-6" strokeWidth={1.75} /> : <Lock className="h-6 w-6" strokeWidth={1.75} />}
          title={t('planner.lockedTitle')}
          description={t('planner.lockedBody')}
        />
        <div className="flex justify-center">
          <Button id="planner-upgrade" onClick={() => navigate('/plans?highlight=pro')}>
            {t('plans.seePlans')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
