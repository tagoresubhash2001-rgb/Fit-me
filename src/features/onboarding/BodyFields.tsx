import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Tabs } from '../../components/ui';
import { cmToFtIn, ftInToCm, kgToLb, lbToKg, type UnitSystem } from '../../domain/units';

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Height input that stores centimetres and shows cm or ft/in. */
export function HeightField({
  cm,
  units,
  onChange,
  error,
}: {
  cm: number | '';
  units: UnitSystem;
  onChange: (cm: number | '') => void;
  error?: string;
}) {
  const { t } = useTranslation();
  if (units === 'metric') {
    return (
      <Input
        label={`${t('onboarding.height')} (${t('onboarding.cm')})`}
        inputMode="decimal"
        value={cm}
        error={error}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
    );
  }
  const { ft, inch } = cm === '' ? { ft: '' as const, inch: '' as const } : cmToFtIn(cm);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-small font-medium text-ink">{t('onboarding.height')}</span>
      <div className="grid grid-cols-2 gap-2">
        <Input
          aria-label={t('onboarding.ft')}
          placeholder={t('onboarding.ft')}
          inputMode="numeric"
          value={ft}
          onChange={(e) => onChange(r1(ftInToCm(Number(e.target.value) || 0, inch || 0)))}
        />
        <Input
          aria-label={t('onboarding.in')}
          placeholder={t('onboarding.in')}
          inputMode="numeric"
          value={inch}
          onChange={(e) => onChange(r1(ftInToCm(ft || 0, Number(e.target.value) || 0)))}
        />
      </div>
      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
}

/** Weight input that stores kilograms and shows kg or lb. */
export function WeightField({
  label,
  kg,
  units,
  onChange,
  error,
}: {
  label: string;
  kg: number | '';
  units: UnitSystem;
  onChange: (kg: number | '') => void;
  error?: string;
}) {
  const { t } = useTranslation();
  const shown = kg === '' ? '' : units === 'imperial' ? r1(kgToLb(kg)) : kg;
  return (
    <Input
      label={`${label} (${units === 'imperial' ? t('onboarding.lb') : t('onboarding.kg')})`}
      inputMode="decimal"
      value={shown}
      error={error}
      onChange={(e) => {
        if (e.target.value === '') return onChange('');
        const v = Number(e.target.value);
        onChange(units === 'imperial' ? r1(lbToKg(v)) : v);
      }}
    />
  );
}

export function UnitsToggle({ units, onChange }: { units: UnitSystem; onChange: (u: UnitSystem) => void }) {
  const { t } = useTranslation();
  return (
    <Tabs
      ariaLabel={t('onboarding.units')}
      value={units}
      onChange={onChange}
      items={[
        { id: 'metric', label: t('onboarding.metric') },
        { id: 'imperial', label: t('onboarding.imperial') },
      ]}
    />
  );
}

export function TimeField({ label, minutes, onChange }: { label: string; minutes: number; onChange: (m: number) => void }) {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return (
    <Input
      label={label}
      type="time"
      value={`${hh}:${mm}`}
      onChange={(e) => {
        const [h, m] = e.target.value.split(':').map(Number);
        if (Number.isFinite(h) && Number.isFinite(m)) onChange(h * 60 + m);
      }}
    />
  );
}
