import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Trash2, Lock } from 'lucide-react';
import { Button, Card, EmptyState, Input, Select, Sheet, Skeleton, Tabs, Badge, toast } from '../../components/ui';
import { searchFoods, customToFoodItem } from '../../data/foods';
import { createRecord, softDelete } from '../../data/records';
import { useAllRecords } from '../../data/useRecords';
import { useSession } from '../../data/session';
import { displayName, isLikelyDuplicate, scaleNutrients, sumNutrients, type FoodItem } from '../../domain/nutrition';
import { planAllows } from '../../domain/plans';
import type { FoodLog, MealSlot, Nutrients } from '../../domain/models';
import { useFormat } from '../../lib/hooks';

type Mode = 'search' | 'saved' | 'recipes' | 'manual';
interface SavedMeal {
  id: string;
  name: string;
  items: Array<Pick<FoodLog, 'foodId' | 'name' | 'servingLabel' | 'servings' | 'grams' | 'nutrients' | 'foodSource'>>;
}
interface Recipe {
  id: string;
  name: string;
  servings: number;
  ingredients: Array<{ foodId: string; name: string; grams: number; nutrients: Nutrients }>;
  perServing: Nutrients;
  gramsPerServing: number;
}
interface CustomFood {
  id: string;
  name: string;
  servingLabel: string;
  grams: number | null;
  nutrients: Nutrients;
}

export function NutrientRows({ n, showMicros }: { n: Nutrients; showMicros: boolean }) {
  const { t } = useTranslation();
  const { n: fmt } = useFormat();
  const rows: Array<[string, string]> = [
    [t('onboarding.calories'), `${fmt(n.calories)} ${t('common.kcal')}`],
    [t('onboarding.protein'), `${fmt(n.proteinG, 1)} ${t('common.g')}`],
    [t('onboarding.carbs'), `${fmt(n.carbsG, 1)} ${t('common.g')}`],
    [t('onboarding.fat'), `${fmt(n.fatG, 1)} ${t('common.g')}`],
    [t('onboarding.fiber'), `${fmt(n.fiberG, 1)} ${t('common.g')}`],
  ];
  return (
    <div className="flex flex-col gap-2">
      <dl className="grid grid-cols-2 gap-2">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded-input bg-raised px-3 py-2">
            <dt className="text-caption text-muted">{k}</dt>
            <dd className="text-body font-semibold text-ink tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {showMicros ? (
        (n.sugarG !== undefined || n.sodiumMg !== undefined) && (
          <dl className="grid grid-cols-2 gap-2">
            {n.sugarG !== undefined && (
              <div className="rounded-input bg-raised px-3 py-2">
                <dt className="text-caption text-muted">{t('food.sugar')}</dt>
                <dd className="text-body font-semibold text-ink tabular-nums">{`${fmt(n.sugarG, 1)} ${t('common.g')}`}</dd>
              </div>
            )}
            {n.sodiumMg !== undefined && (
              <div className="rounded-input bg-raised px-3 py-2">
                <dt className="text-caption text-muted">{t('food.sodium')}</dt>
                <dd className="text-body font-semibold text-ink tabular-nums">{`${fmt(n.sodiumMg)} mg`}</dd>
              </div>
            )}
          </dl>
        )
      ) : (
        <p className="flex items-center gap-2 text-caption text-muted">
          <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {t('food.microsLocked')}
        </p>
      )}
    </div>
  );
}

/** Strips micronutrients for Free users before saving (Premium data is computed but not stored or shown). */
function forPlan(n: Nutrients, premium: boolean): Nutrients {
  if (premium) return n;
  const { sugarG: _s, sodiumMg: _n, ...rest } = n;
  return rest;
}

function QuantityPanel({
  food,
  onAdd,
  busy,
}: {
  food: FoodItem;
  onAdd: (servingLabel: string, servings: number, grams: number, n: Nutrients) => void;
  busy: boolean;
}) {
  const { t, i18n } = useTranslation();
  const plan = useSession((s) => s.plan);
  const options = useMemo(
    () => [
      ...food.servings.map((s) => ({ label: s.labels?.[i18n.language] ?? s.label, grams: s.grams })),
      { label: '100 g', grams: 100 },
      { label: '1 g', grams: 1 },
    ],
    [food, i18n.language],
  );
  const [idx, setIdx] = useState(0);
  const [qty, setQty] = useState<number | ''>(1);
  const grams = (typeof qty === 'number' ? qty : 0) * options[idx].grams;
  const n = scaleNutrients(food.per100g, grams);
  const valid = typeof qty === 'number' && qty > 0 && qty <= 100 * (options[idx].grams === 1 ? 50 : 1);
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-title text-ink">{displayName(food, i18n.language)}</p>
        <p className="text-caption text-muted">{t('food.source', { source: t(`food.sources.${food.source}`) })}</p>
      </div>
      <div className="grid grid-cols-[1fr_1.4fr] gap-2">
        <Input
          label={t('food.quantity')}
          inputMode="decimal"
          value={qty}
          onChange={(e) => setQty(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
        />
        <Select label={t('food.serving')} value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
          {options.map((o, i) => (
            <option key={i} value={i}>
              {o.label}
              {o.grams !== 1 && o.grams !== 100 ? ` (${Math.round(o.grams)} g)` : ''}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-small font-medium text-ink">{t('food.nutrition')}</p>
      <NutrientRows n={n} showMicros={planAllows(plan, 'premium')} />
      <Button
        fullWidth
        disabled={!valid}
        loading={busy}
        onClick={() => onAdd(options[idx].grams === 1 ? 'g' : options[idx].label, qty as number, grams, n)}
      >
        {t('food.addFood')}
      </Button>
    </div>
  );
}

export function AddFoodSheet({
  open,
  onClose,
  slot,
  date,
  dayLogs,
}: {
  open: boolean;
  onClose: () => void;
  slot: MealSlot;
  date: string;
  dayLogs: FoodLog[];
}) {
  const { t, i18n } = useTranslation();
  const plan = useSession((s) => s.plan);
  const premium = planAllows(plan, 'premium');
  const [mode, setMode] = useState<Mode>('search');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<FoodItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [picked, setPicked] = useState<FoodItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [dup, setDup] = useState<null | (() => void)>(null);
  const custom = useAllRecords<CustomFood>('customFoods', 300);
  const saved = useAllRecords<SavedMeal>('savedMeals', 100);
  const recipes = useAllRecords<Recipe>('recipes', 100);

  const localFoods = useMemo(
    () => [
      ...custom.rows.map((c) => customToFoodItem(c)),
      ...recipes.rows.map((r) =>
        customToFoodItem(
          { id: r.id, name: r.name, servingLabel: `1 ${t('food.perServing')}`, grams: r.gramsPerServing, nutrients: r.perServing },
          'custom',
        ),
      ),
    ],
    [custom.rows, recipes.rows, t],
  );

  useEffect(() => {
    if (!open) {
      setQ('');
      setResults(null);
      setPicked(null);
      setMode('search');
    }
  }, [open]);

  useEffect(() => {
    if (mode !== 'search') return;
    if ([...q.trim()].length < 2) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    setSearchError(false);
    const id = setTimeout(() => {
      searchFoods(q, localFoods)
        .then((r) => !cancelled && setResults(r))
        .catch(() => !cancelled && setSearchError(true))
        .finally(() => !cancelled && setSearching(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [q, mode, localFoods]);

  const doAdd = (entry: Omit<FoodLog, 'id' | 'uid' | 'date' | 'tz' | 'source' | 'status' | 'slot'>) => {
    const run = async () => {
      setBusy(true);
      const id = await createRecord('foodLogs', { ...entry, slot, nutrients: forPlan(entry.nutrients, premium) }, { date });
      setBusy(false);
      toast(t('food.logged', { name: entry.name, slot: t(`slots.${slot}`) }), 'success', {
        label: t('common.undo'),
        onClick: () => void softDelete('foodLogs', id),
      });
      onClose();
    };
    const existing = dayLogs.map((l) => ({
      foodId: l.foodId,
      name: l.name,
      slot: l.slot,
      createdAtMs: (l as unknown as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.(),
    }));
    if (isLikelyDuplicate(existing, { foodId: entry.foodId, name: entry.name, slot }, Date.now())) setDup(() => run);
    else void run();
  };

  return (
    <Sheet open={open} onClose={onClose} closeLabel={t('common.close')} title={t('food.addTo', { slot: t(`slots.${slot}`) })}>
      <div className="flex flex-col gap-4">
        {!picked && (
          <Tabs
            value={mode}
            onChange={setMode}
            items={[
              { id: 'search', label: t('common.search') },
              { id: 'saved', label: t('food.savedMeals') },
              { id: 'recipes', label: t('food.recipes') },
              { id: 'manual', label: t('common.add') },
            ]}
          />
        )}

        {dup && (
          <Card tone="subtle" className="flex flex-col gap-3">
            <p className="text-body font-semibold text-ink">{t('food.duplicateTitle')}</p>
            <p className="text-small text-muted">
              {t('food.duplicateBody', { name: picked ? displayName(picked, i18n.language) : '', slot: t(`slots.${slot}`) })}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setDup(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={() => {
                  const f = dup;
                  setDup(null);
                  f();
                }}
              >
                {t('food.addAnyway')}
              </Button>
            </div>
          </Card>
        )}

        {mode === 'search' && !picked && (
          <>
            <div className="relative">
              <Search
                className="pointer-events-none absolute start-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted"
                strokeWidth={1.75}
              />
              <input
                autoFocus
                type="search"
                aria-label={t('common.search')}
                placeholder={t('food.searchPlaceholder')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-12 w-full rounded-input border border-line bg-surface ps-11 pe-3 text-body text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {searching && (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            )}
            {!searching && searchError && <p className="text-small text-danger">{t('errors.loadFailed')}</p>}
            {!searching && results === null && !searchError && <p className="text-small text-muted">{t('food.searchHint')}</p>}
            {!searching && results?.length === 0 && (
              <EmptyState
                title={t('food.noResults', { q })}
                action={
                  <Button variant="secondary" onClick={() => setMode('manual')}>
                    {t('food.addManual')}
                  </Button>
                }
              />
            )}
            {!searching && !!results?.length && (
              <ul className="flex flex-col divide-y divide-line">
                {results.map((f) => {
                  const s = f.servings[0];
                  const kcal = s ? Math.round((f.per100g.calories * s.grams) / 100) : Math.round(f.per100g.calories);
                  return (
                    <li key={`${f.source}-${f.id}`}>
                      <button
                        type="button"
                        onClick={() => setPicked(f)}
                        className="flex w-full items-center gap-3 py-3 text-start hover:bg-raised"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body text-ink">{displayName(f, i18n.language)}</span>
                          <span className="block truncate text-caption text-muted">
                            {s ? `${s.labels?.[i18n.language] ?? s.label} · ` : `${t('food.per100g')} · `}
                            {kcal} {t('common.kcal')}
                          </span>
                        </span>
                        {f.source === 'curated' && <Badge tone="primary">{f.countries?.[0] ?? ''}</Badge>}
                        <Plus className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {picked && (
          <QuantityPanel
            food={picked}
            busy={busy}
            onAdd={(servingLabel, servings, grams, nutrients) =>
              doAdd({
                foodId: picked.id,
                name: displayName(picked, i18n.language),
                servingLabel,
                servings,
                grams,
                nutrients,
                foodSource: picked.source,
              })
            }
          />
        )}
        {picked && (
          <Button variant="ghost" onClick={() => setPicked(null)}>
            {t('common.back')}
          </Button>
        )}

        {mode === 'saved' && !picked && (
          <SavedMealsList
            meals={saved.rows}
            loading={saved.loading}
            onLog={async (m) => {
              for (const it of m.items)
                await createRecord('foodLogs', { ...it, slot, nutrients: forPlan(it.nutrients, premium) }, { date });
              toast(t('food.logged', { name: m.name, slot: t(`slots.${slot}`) }));
              onClose();
            }}
          />
        )}

        {mode === 'recipes' && !picked && (
          <RecipeBuilder
            premium={premium}
            onPickRecipe={(r) =>
              setPicked(
                customToFoodItem({
                  id: r.id,
                  name: r.name,
                  servingLabel: `1 ${t('food.perServing')}`,
                  grams: r.gramsPerServing,
                  nutrients: r.perServing,
                }),
              )
            }
            recipes={recipes.rows}
          />
        )}

        {mode === 'manual' && !picked && (
          <ManualFood
            onSave={async (c) => {
              const id = await createRecord('customFoods', c);
              doAdd({
                foodId: id,
                name: c.name,
                servingLabel: c.servingLabel,
                servings: 1,
                grams: c.grams,
                nutrients: c.nutrients,
                foodSource: 'custom',
              });
            }}
          />
        )}
      </div>
    </Sheet>
  );
}

function SavedMealsList({ meals, loading, onLog }: { meals: SavedMeal[]; loading: boolean; onLog: (m: SavedMeal) => void }) {
  const { t } = useTranslation();
  if (loading) return <Skeleton className="h-20" />;
  if (!meals.length) return <EmptyState title={t('food.noSaved')} />;
  return (
    <ul className="flex flex-col gap-2">
      {meals.map((m) => (
        <li key={m.id}>
          <Card padding="sm" className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-medium text-ink">{m.name}</p>
              <p className="truncate text-caption text-muted">
                {sumNutrients(m.items.map((i) => i.nutrients)).calories} {t('common.kcal')} · {m.items.map((i) => i.name).join(', ')}
              </p>
            </div>
            <Button size="sm" onClick={() => onLog(m)}>
              {t('food.logSavedMeal')}
            </Button>
            <button
              type="button"
              aria-label={t('common.delete')}
              className="p-2 text-muted hover:text-danger"
              onClick={() => void softDelete('savedMeals', m.id)}
            >
              <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          </Card>
        </li>
      ))}
    </ul>
  );
}

const num = (v: string) => (v === '' ? NaN : Number(v));

function ManualFood({ onSave }: { onSave: (c: Omit<CustomFood, 'id'>) => void }) {
  const { t } = useTranslation();
  const [v, setV] = useState({ name: '', servingLabel: '', grams: '', calories: '', proteinG: '', carbsG: '', fatG: '', fiberG: '' });
  const up = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  const nums = ['calories', 'proteinG', 'carbsG', 'fatG', 'fiberG'] as const;
  const valid = v.name.trim().length > 0 && nums.every((k) => Number.isFinite(num(v[k])) && num(v[k]) >= 0) && num(v.calories) <= 10000;
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSave({
          name: v.name.trim(),
          servingLabel: v.servingLabel.trim() || '1',
          grams: v.grams ? Number(v.grams) : null,
          nutrients: {
            calories: num(v.calories),
            proteinG: num(v.proteinG),
            carbsG: num(v.carbsG),
            fatG: num(v.fatG),
            fiberG: num(v.fiberG),
          },
        });
      }}
    >
      <Input label={t('food.foodName')} value={v.name} onChange={up('name')} />
      <div className="grid grid-cols-2 gap-2">
        <Input label={t('food.servingLabel')} hint={t('food.servingLabelHint')} value={v.servingLabel} onChange={up('servingLabel')} />
        <Input label={t('food.gramsOptional')} inputMode="decimal" value={v.grams} onChange={up('grams')} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          label={`${t('onboarding.calories')} (${t('common.kcal')})`}
          inputMode="decimal"
          value={v.calories}
          onChange={up('calories')}
        />
        <Input label={`${t('onboarding.protein')} (${t('common.g')})`} inputMode="decimal" value={v.proteinG} onChange={up('proteinG')} />
        <Input label={`${t('onboarding.carbs')} (${t('common.g')})`} inputMode="decimal" value={v.carbsG} onChange={up('carbsG')} />
        <Input label={`${t('onboarding.fat')} (${t('common.g')})`} inputMode="decimal" value={v.fatG} onChange={up('fatG')} />
        <Input label={`${t('onboarding.fiber')} (${t('common.g')})`} inputMode="decimal" value={v.fiberG} onChange={up('fiberG')} />
      </div>
      <Button type="submit" fullWidth disabled={!valid}>
        {t('food.addFood')}
      </Button>
    </form>
  );
}

function RecipeBuilder({ recipes, onPickRecipe, premium }: { recipes: Recipe[]; onPickRecipe: (r: Recipe) => void; premium: boolean }) {
  const { t, i18n } = useTranslation();
  const [building, setBuilding] = useState(false);
  const [name, setName] = useState('');
  const [servings, setServings] = useState<number | ''>(2);
  const [ingredients, setIngredients] = useState<Recipe['ingredients']>([]);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [grams, setGrams] = useState<number | ''>(100);

  useEffect(() => {
    if ([...q.trim()].length < 2) return setResults([]);
    const id = setTimeout(
      () =>
        void searchFoods(q)
          .then(setResults)
          .catch(() => setResults([])),
      250,
    );
    return () => clearTimeout(id);
  }, [q]);

  if (!building) {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="secondary" icon={<Plus className="h-[18px] w-[18px]" strokeWidth={1.75} />} onClick={() => setBuilding(true)}>
          {t('food.newRecipe')}
        </Button>
        {recipes.map((r) => (
          <Card key={r.id} padding="sm" onPress={() => onPickRecipe(r)} className="flex items-center justify-between gap-2">
            <span className="truncate text-body text-ink">{r.name}</span>
            <span className="shrink-0 text-caption text-muted">
              {r.perServing.calories} {t('common.kcal')} {t('food.perServing')}
            </span>
          </Card>
        ))}
      </div>
    );
  }
  const total = sumNutrients(ingredients.map((i) => i.nutrients));
  const s = typeof servings === 'number' && servings > 0 ? servings : 1;
  const perServing = forPlan(
    {
      calories: Math.round(total.calories / s),
      proteinG: total.proteinG / s,
      carbsG: total.carbsG / s,
      fatG: total.fatG / s,
      fiberG: total.fiberG / s,
      sugarG: (total.sugarG ?? 0) / s,
      sodiumMg: (total.sodiumMg ?? 0) / s,
    },
    premium,
  );
  const totalGrams = ingredients.reduce((a, i) => a + i.grams, 0);
  return (
    <div className="flex flex-col gap-3">
      <Input label={t('food.recipeName')} value={name} onChange={(e) => setName(e.target.value)} />
      <Input
        label={t('food.recipeServings')}
        inputMode="numeric"
        value={servings}
        onChange={(e) => setServings(e.target.value === '' ? '' : Number(e.target.value))}
      />
      <p className="text-small font-medium text-ink">{t('food.ingredients')}</p>
      {ingredients.map((i, idx) => (
        <div key={idx} className="flex items-center justify-between gap-2 rounded-input bg-raised px-3 py-2">
          <span className="truncate text-small text-ink">
            {i.name} · {i.grams} g
          </span>
          <button
            type="button"
            aria-label={t('common.delete')}
            className="text-muted hover:text-danger"
            onClick={() => setIngredients((list) => list.filter((_, j) => j !== idx))}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      ))}
      <div className="grid grid-cols-[1.6fr_1fr] gap-2">
        <Input
          aria-label={t('food.addIngredient')}
          placeholder={t('food.addIngredient')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Input
          aria-label="g"
          inputMode="decimal"
          value={grams}
          onChange={(e) => setGrams(e.target.value === '' ? '' : Number(e.target.value))}
        />
      </div>
      {results.slice(0, 6).map((f) => (
        <button
          key={f.id}
          type="button"
          className="flex items-center justify-between gap-2 rounded-input border border-line px-3 py-2 text-start hover:bg-raised"
          onClick={() => {
            if (typeof grams !== 'number' || grams <= 0) return;
            setIngredients((list) => [
              ...list,
              { foodId: f.id, name: displayName(f, i18n.language), grams, nutrients: forPlan(scaleNutrients(f.per100g, grams), premium) },
            ]);
            setQ('');
          }}
        >
          <span className="truncate text-small text-ink">{displayName(f, i18n.language)}</span>
          <Plus className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
        </button>
      ))}
      {ingredients.length > 0 && (
        <>
          <p className="text-small text-muted">{t('food.perServing')}</p>
          <NutrientRows n={perServing} showMicros={premium} />
        </>
      )}
      <Button
        fullWidth
        disabled={!name.trim() || !ingredients.length || typeof servings !== 'number' || servings <= 0}
        onClick={async () => {
          await createRecord('recipes', {
            name: name.trim(),
            servings: s,
            ingredients,
            perServing,
            gramsPerServing: Math.round(totalGrams / s),
          });
          toast(t('common.saved'));
          setBuilding(false);
          setName('');
          setIngredients([]);
        }}
      >
        {t('food.saveRecipe')}
      </Button>
    </div>
  );
}
