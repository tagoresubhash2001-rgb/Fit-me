import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Plus, Trash2, BookmarkPlus } from 'lucide-react';
import { Button, Card, IconButton, ProgressBar, Skeleton, toast, Sheet, Input } from '../../components/ui';
import { useRecords } from '../../data/useRecords';
import { useSession } from '../../data/session';
import { createRecord, softDelete, restore, updateRecord } from '../../data/records';
import { useToday, useFormat, nowMinutes } from '../../lib/hooks';
import { addDays } from '../../domain/dates';
import { MEAL_SLOTS, type FoodLog, type MealSlot } from '../../domain/models';
import { slotForMinutes, sumNutrients, totalsBySlot } from '../../domain/nutrition';
import { AddFoodSheet } from './AddFoodSheet';

export default function FoodScreen() {
  const { t } = useTranslation();
  const { n, date: fmtDate } = useFormat();
  const today = useToday();
  const [params, setParams] = useSearchParams();
  const date = params.get('date') ?? today;
  const profile = useSession((s) => s.profile)!;
  const logs = useRecords<FoodLog>('foodLogs', date, date);
  const [addSlot, setAddSlot] = useState<MealSlot | null>(null);
  const [editing, setEditing] = useState<FoodLog | null>(null);
  const [saveSlot, setSaveSlot] = useState<MealSlot | null>(null);
  const bySlot = useMemo(() => totalsBySlot(logs.rows), [logs.rows]);
  const total = sumNutrients(logs.rows.map((l) => l.nutrients));
  const go = (d: string) => setParams(d === today ? {} : { date: d });
  const defaultSlot = slotForMinutes(nowMinutes());

  const remove = (l: FoodLog) => {
    void softDelete('foodLogs', l.id);
    toast(t('food.removed', { name: l.name }), 'info', { label: t('common.undo'), onClick: () => void restore('foodLogs', l.id) });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <IconButton label={t('common.back')} onClick={() => go(addDays(date, -1))}>
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" strokeWidth={1.75} />
        </IconButton>
        <div className="text-center">
          <h1 className="text-title text-ink">{t('food.title')}</h1>
          <p className="text-small text-muted">
            {date === today
              ? t('common.today')
              : date === addDays(today, -1)
                ? t('common.yesterday')
                : fmtDate(date, { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>
        <IconButton label={t('common.continue')} disabled={date >= today} onClick={() => go(addDays(date, 1))}>
          <ChevronRight className="h-5 w-5 rtl:rotate-180" strokeWidth={1.75} />
        </IconButton>
      </div>

      <Card>
        <div className="flex items-baseline justify-between">
          <span className="text-small text-muted">{t('food.dayTotal')}</span>
          <span className="text-title text-ink tabular-nums">
            {n(total.calories)} / {n(profile.targets.calories)} {t('common.kcal')}
          </span>
        </div>
        <ProgressBar
          className="mt-2"
          value={total.calories}
          max={profile.targets.calories}
          colorClass={total.calories > profile.targets.calories ? 'bg-accent-fill' : 'bg-primary'}
          label={t('food.dayTotal')}
        />
        <p className="mt-2 text-caption text-muted tabular-nums">
          {t('onboarding.protein')} {n(total.proteinG)} {t('common.g')} · {t('onboarding.carbs')} {n(total.carbsG)} {t('common.g')} ·{' '}
          {t('onboarding.fat')} {n(total.fatG)} {t('common.g')} · {t('onboarding.fiber')} {n(total.fiberG)} {t('common.g')}
        </p>
      </Card>

      {logs.error && <p className="text-small text-danger">{t('errors.loadFailed')}</p>}

      {MEAL_SLOTS.map((slot) => {
        const items = logs.rows.filter((l) => l.slot === slot);
        if (slot === 'other' && !items.length) return null;
        return (
          <Card key={slot} id={`slot-${slot}`} className={slot === defaultSlot && date === today ? 'border-primary/30' : undefined}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-body font-semibold text-ink">{t(`slots.${slot}`)}</h2>
                <p className="text-caption text-muted tabular-nums">
                  {n(bySlot[slot].calories)} {t('common.kcal')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {items.length > 0 && (
                  <IconButton label={t('food.saveMeal')} onClick={() => setSaveSlot(slot)}>
                    <BookmarkPlus className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </IconButton>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Plus className="h-4 w-4" strokeWidth={1.75} />}
                  onClick={() => setAddSlot(slot)}
                >
                  {t('common.add')}
                </Button>
              </div>
            </div>
            {logs.loading ? (
              <Skeleton className="h-10" />
            ) : items.length === 0 ? (
              <p className="text-small text-muted">{t('food.emptySlot')}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {items.map((l) => (
                  <li key={l.id} className="flex items-center gap-2 py-2">
                    <button type="button" className="min-w-0 flex-1 text-start" onClick={() => setEditing(l)}>
                      <span className="block truncate text-body text-ink">{l.name}</span>
                      <span className="block truncate text-caption text-muted">
                        {n(l.servings, 2)} × {l.servingLabel} · {n(l.nutrients.calories)} {t('common.kcal')}
                      </span>
                    </button>
                    <IconButton label={t('common.delete')} onClick={() => remove(l)}>
                      <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}

      <AddFoodSheet open={!!addSlot} onClose={() => setAddSlot(null)} slot={addSlot ?? defaultSlot} date={date} dayLogs={logs.rows} />
      <EditFoodSheet log={editing} onClose={() => setEditing(null)} />
      <SaveMealSheet slot={saveSlot} items={logs.rows.filter((l) => l.slot === saveSlot)} onClose={() => setSaveSlot(null)} />
    </div>
  );
}

function EditFoodSheet({ log, onClose }: { log: FoodLog | null; onClose: () => void }) {
  const { t } = useTranslation();
  const [servings, setServings] = useState<number | ''>('');
  const [slot, setSlot] = useState<MealSlot>('breakfast');
  React.useEffect(() => {
    if (log) {
      setServings(log.servings);
      setSlot(log.slot);
    }
  }, [log]);
  if (!log) return null;
  const factor = typeof servings === 'number' && servings > 0 ? servings / log.servings : 1;
  const scaled = Object.fromEntries(
    Object.entries(log.nutrients).map(([k, v]) => [k, Math.round((v as number) * factor * 10) / 10]),
  ) as FoodLog['nutrients'];
  return (
    <Sheet
      open
      onClose={onClose}
      closeLabel={t('common.close')}
      title={log.name}
      footer={
        <Button
          fullWidth
          disabled={typeof servings !== 'number' || servings <= 0}
          onClick={() => {
            void updateRecord('foodLogs', log.id, {
              servings,
              slot,
              nutrients: { ...scaled, calories: Math.round(scaled.calories) },
              grams: log.grams ? Math.round(log.grams * factor) : null,
            });
            toast(t('common.saved'));
            onClose();
          }}
        >
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          label={`${t('food.quantity')} (${log.servingLabel})`}
          inputMode="decimal"
          value={servings}
          onChange={(e) => setServings(e.target.value === '' ? '' : Number(e.target.value))}
        />
        <label className="flex flex-col gap-1.5 text-small font-medium text-ink">
          {t('food.serving')}
          <select
            className="h-12 rounded-input border border-line bg-surface px-3 text-body"
            value={slot}
            onChange={(e) => setSlot(e.target.value as MealSlot)}
          >
            {MEAL_SLOTS.map((s) => (
              <option key={s} value={s}>
                {t(`slots.${s}`)}
              </option>
            ))}
          </select>
        </label>
        <p className="text-small text-muted tabular-nums">
          {Math.round(scaled.calories)} {t('common.kcal')}
        </p>
      </div>
    </Sheet>
  );
}

function SaveMealSheet({ slot, items, onClose }: { slot: MealSlot | null; items: FoodLog[]; onClose: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  React.useEffect(() => {
    setName(slot ? t(`slots.${slot}`) : '');
  }, [slot, t]);
  if (!slot) return null;
  return (
    <Sheet
      open
      onClose={onClose}
      closeLabel={t('common.close')}
      title={t('food.saveMeal')}
      footer={
        <Button
          fullWidth
          disabled={!name.trim()}
          onClick={async () => {
            await createRecord('savedMeals', {
              name: name.trim(),
              items: items.map(({ foodId, name: nm, servingLabel, servings, grams, nutrients, foodSource }) => ({
                foodId,
                name: nm,
                servingLabel,
                servings,
                grams,
                nutrients,
                foodSource: foodSource ?? 'custom',
              })),
            });
            toast(t('food.mealSaved'));
            onClose();
          }}
        >
          {t('common.save')}
        </Button>
      }
    >
      <Input label={t('food.recipeName')} value={name} onChange={(e) => setName(e.target.value)} />
    </Sheet>
  );
}
