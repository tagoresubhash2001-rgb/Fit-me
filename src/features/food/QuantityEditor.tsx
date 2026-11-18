import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Select, Stepper, cn } from '../../components/ui';
import { useSession } from '../../data/session';
import { GENERIC_UNITS, MULTIPLIERS, clampQuantity, nutrientsFor, stepFor, unitOptionsFor, type UnitOption } from '../../domain/quantity';
import { matchAllergens, matchRestrictions } from '../../domain/allergens';
import type { FoodItem } from '../../domain/nutrition';
import type { Nutrients } from '../../domain/models';

export interface QuantityState {
  unitId: string;
  quantity: number | '';
}

export function useUnitOptions(food: Pick<FoodItem, 'servings'>): UnitOption[] {
  const { t, i18n } = useTranslation();
  return useMemo(() => {
    const labels = Object.fromEntries(GENERIC_UNITS.map((u) => [u, t(`qty.units.${u}`)])) as Record<(typeof GENERIC_UNITS)[number], string>;
    return unitOptionsFor(food, labels, i18n.language);
  }, [food, t, i18n.language]);
}

/** Allergy / restriction warning for a food (owner correction 4). Name-based, so worded as a caution. */
export function AllergyWarning({ names, className }: { names: string[]; className?: string }) {
  const { t, i18n } = useTranslation();
  const profile = useSession((s) => s.profile);
  const allergies = matchAllergens(names, profile?.allergies ?? []);
  const restrictions = matchRestrictions(names, profile?.restrictions ?? []);
  if (!allergies.length && !restrictions.length) return null;
  const label = (ns: string, v: string) => (i18n.exists(`${ns}.${v}`) ? t(`${ns}.${v}`) : v);
  const items = [...allergies.map((a) => label('allergen', a)), ...restrictions.map((r) => label('restriction', r))];
  return (
    <p role="alert" className={cn('flex items-start gap-2 rounded-input border border-accent-fill/40 bg-accent-subtle p-3 text-small text-ink', className)}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
      <span>{t('food.allergyWarning', { items: items.join(', ') })}</span>
    </p>
  );
}

/** Quantity with stepper, unit dropdown and multiplier chips (owner correction 8). */
export function QuantityEditor({ options, state, onChange }: { options: UnitOption[]; state: QuantityState; onChange: (s: QuantityState) => void }) {
  const { t } = useTranslation();
  const option = options.find((o) => o.id === state.unitId) ?? options[0];
  const step = stepFor(option.id);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[1.25fr_1fr] items-end gap-2">
        <Stepper
          label={t('food.quantity')}
          value={state.quantity}
          onChange={(q) => onChange({ ...state, quantity: q })}
          step={step}
          min={step}
          max={option.id === 'g' || option.id === 'ml' ? 5000 : 50}
          decreaseLabel={t('common.decrease')}
          increaseLabel={t('common.increase')}
        />
        <Select
          label={t('food.unit')}
          value={option.id}
          onChange={(e) => {
            const next = options.find((o) => o.id === e.target.value)!;
            // Keep the same amount of food when switching units, then round to the new unit's step.
            const grams = (typeof state.quantity === 'number' ? state.quantity : 1) * option.grams;
            onChange({ unitId: next.id, quantity: clampQuantity(grams / next.grams, next.id) });
          }}
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
              {o.id !== 'g' && o.id !== 'ml' ? ` (${Math.round(o.grams)} g${o.approximate ? `, ${t('qty.approx')}` : ''})` : ''}
            </option>
          ))}
        </Select>
      </div>
      {option.id !== 'g' && option.id !== 'ml' && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('qty.quick')}>
          {MULTIPLIERS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={state.quantity === m}
              onClick={() => onChange({ ...state, quantity: m })}
              className={cn('h-9 rounded-full border px-3.5 text-small font-medium transition-colors duration-150 active:scale-95', state.quantity === m ? 'border-primary bg-primary-subtle text-primary-text' : 'border-line bg-surface text-ink hover:bg-raised')}
            >
              {m}×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function quantityResult(per100g: Nutrients, options: UnitOption[], s: QuantityState) {
  const option = options.find((o) => o.id === s.unitId) ?? options[0];
  const q = typeof s.quantity === 'number' && s.quantity > 0 ? s.quantity : 0;
  return { option, quantity: q, grams: Math.round(q * option.grams), nutrients: nutrientsFor(per100g, q, option) };
}
