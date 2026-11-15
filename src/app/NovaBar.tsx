import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flame, Timer } from 'lucide-react';
import { useSession } from '../data/session';
import { useRecords } from '../data/useRecords';
import { useToday, useFormat } from '../lib/hooks';
import { sumNutrients } from '../domain/nutrition';
import type { FoodLog } from '../domain/models';
import { useWorkoutSession, elapsedMs, formatClock } from '../features/workouts/session';

/**
 * Nova Bar (PRD section 7): a floating pill with live activity. Shows the running workout timer when a
 * workout is active, otherwise calories left today. Real data only. Native Live Activities come later.
 */
export function NovaBar() {
  const { t } = useTranslation();
  const { n } = useFormat();
  const navigate = useNavigate();
  const profile = useSession((s) => s.profile);
  const today = useToday();
  const food = useRecords<FoodLog>('foodLogs', today, today);
  const active = useWorkoutSession((s) => s.active);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!profile) return null;
  if (active) {
    return (
      <div className="sticky top-[68px] z-30 flex justify-center px-4 pt-2">
        <button
          type="button"
          onClick={() => navigate('/workouts')}
          className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-small font-semibold text-canvas shadow-float"
          aria-live="polite"
        >
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
          <Timer className="h-4 w-4" strokeWidth={1.75} />
          <span>{t('workouts.inProgress')}</span>
          <span className="tabular-nums">{formatClock(elapsedMs(active))}</span>
        </button>
      </div>
    );
  }
  if (food.loading) return null;
  const eaten = sumNutrients(food.rows.map((r) => r.nutrients)).calories;
  const left = profile.targets.calories - eaten;
  return (
    <div className="flex justify-center px-4 pt-3">
      <button
        type="button"
        onClick={() => navigate('/food')}
        className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-small text-ink shadow-card"
      >
        <Flame className="h-4 w-4 text-accent" strokeWidth={1.75} />
        <span className="tabular-nums font-semibold">{n(Math.abs(left))}</span>
        <span className="text-muted">
          {t('common.kcal')} {left >= 0 ? t('common.left') : t('common.over')}
        </span>
      </button>
    </div>
  );
}
