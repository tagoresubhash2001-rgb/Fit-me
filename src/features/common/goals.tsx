import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, TrendingUp, Scale, Dumbbell, Activity, Salad, Moon, Leaf, Zap, Star } from 'lucide-react';
import { Badge, cn } from '../../components/ui';
import { GOAL_IDS, conflictWith, recommendGoals, normalizePrimary, WEIGHT_GOALS, type GoalId } from '../../domain/goals';
import type { ActivityLevel } from '../../domain/calculators';

const ICONS: Record<GoalId, React.ElementType> = {
  lose: Flame,
  gain: TrendingUp,
  maintain: Scale,
  build_muscle: Dumbbell,
  improve_fitness: Activity,
  eat_healthier: Salad,
  sleep_better: Moon,
  reduce_stress: Leaf,
  improve_energy: Zap,
};

/** Multi-goal picker with recommendations and a primary goal (owner correction 3). */
export function GoalPicker({ selected, primary, onChange, bmi, age, activity }: { selected: GoalId[]; primary: GoalId | null; onChange: (selected: GoalId[], primary: GoalId | null) => void; bmi: number | null; age: number | null; activity: ActivityLevel | null }) {
  const { t } = useTranslation();
  const [conflict, setConflict] = useState<string | null>(null);
  const recs = recommendGoals(bmi, age, activity);
  const toggle = (g: GoalId) => {
    if (selected.includes(g)) {
      const next = selected.filter((x) => x !== g);
      setConflict(null);
      return onChange(next, normalizePrimary(next, primary));
    }
    const c = conflictWith(g, selected);
    if (c) return setConflict(t('goalPicker.conflict', { a: t(`goals.${g}`), b: t(`goals.${c}`) }));
    setConflict(null);
    const next = [...selected, g];
    onChange(next, normalizePrimary(next, primary));
  };
  return (
    <div className="flex flex-col gap-2">
      <p className="text-small text-muted">{t('goalPicker.hint')}</p>
      <ul className="flex flex-col gap-2">
        {GOAL_IDS.map((g) => {
          const Icon = ICONS[g];
          const on = selected.includes(g);
          const rec = recs.find((r) => r.goal === g);
          const isPrimary = primary === g;
          return (
            <li key={g}>
              <div className={cn('flex min-h-14 items-center gap-3 rounded-input border p-3 transition-colors duration-150', on ? 'border-primary bg-primary-subtle' : 'border-line bg-surface')}>
                <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(g)} className="flex min-w-0 flex-1 items-center gap-3 text-start">
                  <Icon className={cn('h-5 w-5 shrink-0', on ? 'text-primary-text' : 'text-muted')} strokeWidth={1.75} />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-body font-medium text-ink">{t(`goals.${g}`)}</span>
                      {rec && <Badge tone="primary">{t('goalPicker.recommended')}</Badge>}
                    </span>
                    {rec && <span className="block text-caption text-muted">{t(`goalPicker.reasons.${rec.reason}`)}</span>}
                  </span>
                </button>
                {on && selected.length > 1 && (
                  <button
                    type="button"
                    aria-pressed={isPrimary}
                    onClick={() => onChange(selected, g)}
                    className={cn('flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-caption font-semibold transition-colors', isPrimary ? 'bg-primary text-on-primary' : 'border border-line bg-surface text-muted hover:text-ink')}
                  >
                    <Star className="h-3.5 w-3.5" strokeWidth={2} />
                    {isPrimary ? t('goalPicker.primary') : t('goalPicker.makePrimary')}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {conflict && (
        <p role="alert" className="text-small text-danger-text">
          {conflict}
        </p>
      )}
      {primary && !WEIGHT_GOALS.includes(primary) && <p className="text-caption text-muted">{t('goalPicker.maintainNote')}</p>}
    </div>
  );
}
