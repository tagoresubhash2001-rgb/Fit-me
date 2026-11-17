import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Plus, BookmarkPlus } from 'lucide-react';
import {
  Button,
  Card,
  IconButton,
  ListDetail,
  ProgressBar,
  Skeleton,
  toast,
  Sheet,
  Input,
  Select,
  Stepper,
  SwipeRow,
} from '../../components/ui';
import { AllergyWarning, QuantityEditor, quantityResult, useUnitOptions, type QuantityState } from './QuantityEditor';
import { TimeField } from '../onboarding/BodyFields';
import { useRecords } from '../../data/useRecords';
import { useSession } from '../../data/session';
import { createRecord, softDelete, restore, updateRecord } from '../../data/records';
import { useToday, useFormat, nowMinutes } from '../../lib/hooks';
import { addDays, formatMinutes } from '../../domain/dates';
import { MEAL_SLOTS, type FoodLog, type MealSlot } from '../../domain/models';
import { slotForMinutes, sumNutrients, totalsBySlot } from '../../domain/nutrition';
import { AddFoodSheet } from './AddFoodSheet';
import { useMediaQuery } from '../../lib/breakpoints';

export default function FoodScreen() {
  const { t } = useTranslation();
  const { n, lang, date: fmtDate } = useFormat();
  const today = useToday();
  const [params, setParams] = useSearchParams();
  const date = params.get('date') ?? today;
  const profile = useSession((s) => s.profile)!;
  const logs = useRecords<FoodLog>('foodLogs', date, date);
  const [addSlot, setAddSlot] = useState<MealSlot | null>(null);
  const [editing, setEditing] = useState<FoodLog | null>(null);
  const [replacing, setReplacing] = useState<FoodLog | null>(null);
  const [saveSlot, setSaveSlot] = useState<MealSlot | null>(null);
  const bySlot = useMemo(() => totalsBySlot(logs.rows), [logs.rows]);
  const total = sumNutrients(logs.rows.map((l) => l.nutrients));
  const go = (d: string) => setParams(d === today ? {} : { date: d });
  const defaultSlot = slotForMinutes(nowMinutes());
  // Split view (list + quick-add / edit panel) from 1024 px: tablet landscape and desktop.
  const split = useMediaQuery('(min-width: 1024px)');
  const [quickSlot, setQuickSlot] = useState<MealSlot | null>(null);
  const [quick, setQuick] = useState({ key: 0, q: '', focus: false });
  const [addQuery, setAddQuery] = useState('');
  const openAdd = (slot: MealSlot, q = '') => {
    if (split) {
      setEditing(null);
      setQuickSlot(slot);
      setQuick((x) => ({ key: x.key + 1, q, focus: true }));
    } else {
      setAddQuery(q);
      setAddSlot(slot);
    }
  };
  // Deep links from search, the N shortcut and Home: /food?add=auto|<slot>&q=...
  const addParam = params.get('add');
  const qParam = params.get('q') ?? '';
  useEffect(() => {
    if (!addParam) return;
    const slot = (MEAL_SLOTS as string[]).includes(addParam) ? (addParam as MealSlot) : defaultSlot;
    openAdd(slot, qParam);
    const next = new URLSearchParams(params);
    next.delete('add');
    next.delete('q');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addParam, qParam]);

  const remove = (l: FoodLog) => {
    void softDelete('foodLogs', l.id);
    toast(t('food.removed', { name: l.name }), 'info', { label: t('common.undo'), onClick: () => void restore('foodLogs', l.id) });
  };

  return (
    <>
      <ListDetail
        detailLabel={t('food.quickAdd')}
        list={
          <div className="stagger flex min-w-0 flex-col gap-4">
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
                        onClick={() => openAdd(slot)}
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
                    <ul className="-mx-2 flex flex-col divide-y divide-line">
                      {items.map((l) => (
                        <SwipeRow
                          key={l.id}
                          className="px-2"
                          onEdit={() => setEditing(l)}
                          onDelete={() => remove(l)}
                          editLabel={t('common.edit')}
                          deleteLabel={t('common.delete')}
                          menuLabel={t('common.moreActions')}
                        >
                          <button type="button" className="block w-full py-2.5 text-start" onClick={() => setEditing(l)}>
                            <span className="block truncate text-body text-ink">{l.name}</span>
                            <span className="block truncate text-caption text-muted">
                              {l.unitId === 'g' || l.unitId === 'ml'
                                ? `${n(l.servings)} ${l.servingLabel}`
                                : l.servings === 1
                                  ? l.servingLabel
                                  : `${n(l.servings, 2)} × ${l.servingLabel}`}{' '}
                              · {n(l.nutrients.calories)} {t('common.kcal')}
                              {(l as FoodLog & { timeMinutes?: number }).timeMinutes !== undefined &&
                                ` · ${formatMinutes((l as FoodLog & { timeMinutes: number }).timeMinutes, lang)}`}
                            </span>
                          </button>
                        </SwipeRow>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        }
        detail={
          split ? (
            editing ? (
              <EditFoodSheet
                key={editing.id}
                inline
                log={editing}
                onClose={() => setEditing(null)}
                onReplace={(l) => {
                  setEditing(null);
                  setReplacing(l);
                }}
              />
            ) : (
              <AddFoodSheet
                key={`${quick.key}-${quickSlot ?? defaultSlot}-${date}`}
                inline
                open
                autoFocusSearch={quick.focus}
                initialQuery={quick.q}
                onClose={() => setQuick((x) => ({ key: x.key + 1, q: '', focus: false }))}
                slot={quickSlot ?? defaultSlot}
                date={date}
                dayLogs={logs.rows}
              />
            )
          ) : undefined
        }
      />
      <AddFoodSheet
        open={!split && !!addSlot}
        onClose={() => setAddSlot(null)}
        slot={addSlot ?? defaultSlot}
        date={date}
        dayLogs={logs.rows}
        initialQuery={addQuery}
        key={`m-${addSlot ?? 'none'}-${addQuery}`}
      />
      <EditFoodSheet
        log={split ? null : editing}
        onClose={() => setEditing(null)}
        onReplace={(l) => {
          setEditing(null);
          setReplacing(l);
        }}
      />
      <AddFoodSheet
        open={!!replacing}
        onClose={() => setReplacing(null)}
        slot={replacing?.slot ?? defaultSlot}
        date={date}
        dayLogs={logs.rows}
        replaceId={replacing?.id}
      />
      <SaveMealSheet slot={saveSlot} items={logs.rows.filter((l) => l.slot === saveSlot)} onClose={() => setSaveSlot(null)} />
    </>
  );
}

type LogWithExtras = FoodLog & { timeMinutes?: number };

/** Edit a food entry: quantity, unit, meal slot, time, or replace the food (owner correction 10). */
function EditFoodSheet({
  log,
  onClose,
  onReplace,
  inline,
}: {
  log: LogWithExtras | null;
  onClose: () => void;
  onReplace: (l: FoodLog) => void;
  inline?: boolean;
}) {
  const { t } = useTranslation();
  // Entries saved before units existed have no per-100 g values: derive them from grams, else scale by servings.
  const per100g = useMemo(() => {
    if (!log) return null;
    if (log.per100g) return log.per100g;
    if (log.grams && log.grams > 0) {
      const f = 100 / log.grams;
      return Object.fromEntries(Object.entries(log.nutrients).map(([k, v]) => [k, (v as number) * f])) as FoodLog['nutrients'];
    }
    return null;
  }, [log]);
  const servings = useMemo(
    () =>
      log?.servingsOptions?.length
        ? log.servingsOptions
        : log && log.grams && log.servings
          ? [{ label: log.servingLabel, grams: log.grams / log.servings }]
          : [],
    [log],
  );
  const options = useUnitOptions({ servings });
  const [state, setState] = useState<QuantityState>({ unitId: 'g', quantity: 1 });
  const [legacyQty, setLegacyQty] = useState<number | ''>('');
  const [slot, setSlot] = useState<MealSlot>('breakfast');
  const [time, setTime] = useState(12 * 60);
  React.useEffect(() => {
    if (!log) return;
    setSlot(log.slot);
    setTime(log.timeMinutes ?? nowMinutes());
    setLegacyQty(log.servings);
    const match =
      log.unitId && options.some((o) => o.id === log.unitId)
        ? log.unitId
        : (options.find((o) => o.label === log.servingLabel)?.id ?? options[0]?.id ?? 'g');
    setState({ unitId: match, quantity: log.servings });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log]);
  if (!log) return null;
  const exact = per100g ? quantityResult(per100g, options, state) : null;
  const factor = !exact && typeof legacyQty === 'number' && legacyQty > 0 ? legacyQty / log.servings : 1;
  const nutrients = exact
    ? exact.nutrients
    : (Object.fromEntries(
        Object.entries(log.nutrients).map(([k, v]) => [k, Math.round((v as number) * factor * 10) / 10]),
      ) as FoodLog['nutrients']);
  const valid = exact ? exact.quantity > 0 : typeof legacyQty === 'number' && legacyQty > 0;
  const save = () => {
    const patch: Record<string, unknown> = {
      slot,
      timeMinutes: time,
      nutrients: { ...nutrients, calories: Math.round(nutrients.calories) },
    };
    if (exact)
      Object.assign(patch, {
        servings: exact.quantity,
        servingLabel: exact.option.label,
        grams: exact.grams,
        unitId: exact.option.id,
        unitGrams: exact.option.grams,
      });
    else Object.assign(patch, { servings: legacyQty, grams: log.grams ? Math.round(log.grams * factor) : null });
    void updateRecord('foodLogs', log.id, patch);
    toast(t('common.saved'));
    onClose();
  };
  return (
    <Sheet
      inline={inline}
      open
      onClose={onClose}
      closeLabel={t('common.close')}
      title={t('food.editEntry')}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onReplace(log)}>
            {t('food.replaceFood')}
          </Button>
          <Button className="flex-1" disabled={!valid} onClick={save}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-title text-ink">{log.name}</p>
        <AllergyWarning names={[log.name]} />
        {exact ? (
          <QuantityEditor options={options} state={state} onChange={setState} />
        ) : (
          <Stepper
            label={`${t('food.quantity')} (${log.servingLabel})`}
            value={legacyQty}
            onChange={setLegacyQty}
            step={0.5}
            min={0.5}
            max={50}
            decreaseLabel={t('common.decrease')}
            increaseLabel={t('common.increase')}
          />
        )}
        <div className="grid grid-cols-2 gap-2">
          <Select label={t('food.mealSlot')} value={slot} onChange={(e) => setSlot(e.target.value as MealSlot)}>
            {MEAL_SLOTS.map((s) => (
              <option key={s} value={s}>
                {t(`slots.${s}`)}
              </option>
            ))}
          </Select>
          <TimeField label={t('common.time')} minutes={time} onChange={setTime} />
        </div>
        <p className="rounded-input bg-raised px-3 py-2 text-small text-ink tabular-nums">
          {Math.round(nutrients.calories)} {t('common.kcal')} · {t('onboarding.protein')} {Math.round(nutrients.proteinG * 10) / 10}{' '}
          {t('common.g')} · {t('onboarding.carbs')} {Math.round(nutrients.carbsG * 10) / 10} {t('common.g')} · {t('onboarding.fat')}{' '}
          {Math.round(nutrients.fatG * 10) / 10} {t('common.g')}
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
