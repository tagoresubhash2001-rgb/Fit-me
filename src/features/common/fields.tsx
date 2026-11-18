import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '../../components/ui';
import { cn } from '../../components/ui/cn';
import { daysInMonth, validateDob, toIsoDate, parseIsoDate, ageOn, yearOptions, type DobError } from '../../domain/dob';
import { cmToFtIn, ftInToCm, kgToLb, lbToKg, kgToStLb, stLbToKg, mlToVolume, volumeToMl, type HeightUnit, type WeightUnit, type VolumeUnit } from '../../domain/units';

const r1 = (n: number) => Math.round(n * 10) / 10;
const num = (s: string): number | '' => (s.trim() === '' ? '' : Number(s.replace(',', '.')));
const fieldCls = (error?: boolean) =>
  cn('h-12 min-w-0 rounded-input border bg-surface px-3 text-body tabular-nums text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20', error ? 'border-danger' : 'border-line');

// ---------- Date of birth (owner correction 1) ----------
export interface DobValue {
  y: number | '';
  m: number | '';
  d: number | '';
}
export const dobFromIso = (iso?: string | null): DobValue => {
  const p = iso ? parseIsoDate(iso) : null;
  return p ? { y: p.y, m: p.m, d: p.d } : { y: '', m: '', d: '' };
};
export const dobToIso = (v: DobValue): string | null => (v.y !== '' && v.m !== '' && v.d !== '' ? toIsoDate(v.y, v.m, v.d) : null);
export const dobError = (v: DobValue, todayIso: string): DobError | null => validateDob(v.y, v.m, v.d, todayIso);

/**
 * Day / Month / Year dropdowns. Native selects open the platform wheel picker on iOS and Android and
 * support type-to-jump on desktop. Days follow the month and leap years; the age is shown live.
 */
export function DobPicker({ value, onChange, todayIso, showError }: { value: DobValue; onChange: (v: DobValue) => void; todayIso: string; showError?: boolean }) {
  const { t, i18n } = useTranslation();
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(i18n.language, { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, i, 1)))), [i18n.language]);
  const years = useMemo(() => yearOptions(todayIso), [todayIso]);
  const maxDay = value.y !== '' && value.m !== '' ? daysInMonth(value.y, value.m) : 31;
  const err = dobError(value, todayIso);
  const iso = dobToIso(value);
  const age = iso && !err ? ageOn(iso, todayIso) : null;
  const set = (p: Partial<DobValue>) => {
    const next = { ...value, ...p };
    if (next.y !== '' && next.m !== '' && next.d !== '' && next.d > daysInMonth(next.y, next.m)) next.d = daysInMonth(next.y, next.m);
    onChange(next);
  };
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-small font-medium text-ink">{t('dob.label')}</legend>
      <div className="grid grid-cols-[1fr_1.6fr_1.3fr] gap-2">
        <Select aria-label={t('dob.day')} value={value.d} onChange={(e) => set({ d: e.target.value === '' ? '' : Number(e.target.value) })} error={showError && err ? ' ' : undefined}>
          <option value="">{t('dob.day')}</option>
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Select aria-label={t('dob.month')} value={value.m} onChange={(e) => set({ m: e.target.value === '' ? '' : Number(e.target.value) })} error={showError && err ? ' ' : undefined}>
          <option value="">{t('dob.month')}</option>
          {months.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </Select>
        <Select aria-label={t('dob.year')} value={value.y} onChange={(e) => set({ y: e.target.value === '' ? '' : Number(e.target.value) })} error={showError && err ? ' ' : undefined}>
          <option value="">{t('dob.year')}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>
      {age !== null ? (
        <p className="text-small text-primary-text" aria-live="polite">
          {t('dob.age', { count: age })}
        </p>
      ) : (
        showError && err && <p role="alert" className="text-caption text-danger-text">{t(`dob.errors.${err}`)}</p>
      )}
    </fieldset>
  );
}

/** Number input that keeps the user's typed text while focused, so unit conversion never rewrites it mid-typing. */
function DraftInput({ value, onText, ...rest }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & { value: number | ''; onText: (s: string) => void }) {
  const [draft, setDraft] = React.useState<string | null>(null);
  return (
    <input
      {...rest}
      value={draft ?? String(value)}
      onFocus={() => setDraft(String(value))}
      onBlur={() => setDraft(null)}
      onChange={(e) => {
        setDraft(e.target.value);
        onText(e.target.value);
      }}
    />
  );
}

// ---------- Height and weight with units (owner correction 2) ----------
const RANGES = { height: { min: 100, max: 250, step: 0.5 }, weight: { min: 25, max: 350, step: 0.1 } };

function Slider({ value, min, max, step, onChange, label }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="range-ruler mt-2 h-8 w-full cursor-pointer"
      style={{ '--fill': `${Math.max(0, Math.min(100, pct))}%` } as React.CSSProperties}
    />
  );
}

export function MeasureInput({
  kind,
  label,
  valueMetric,
  unit,
  onUnitChange,
  onChange,
  error,
}: {
  kind: 'height' | 'weight';
  label: string;
  valueMetric: number | '';
  unit: HeightUnit | WeightUnit;
  onUnitChange: (u: HeightUnit | WeightUnit) => void;
  onChange: (metric: number | '') => void;
  error?: string;
}) {
  const { t } = useTranslation();
  const range = RANGES[kind];
  const v = typeof valueMetric === 'number' ? valueMetric : '';
  const units: Array<HeightUnit | WeightUnit> = kind === 'height' ? ['cm', 'ftin'] : ['kg', 'lb', 'stlb'];

  let fields: React.ReactNode;
  if (unit === 'ftin') {
    const p = v === '' ? null : cmToFtIn(v);
    fields = (
      <div className="grid flex-1 grid-cols-2 gap-2">
        <div className="relative">
          <DraftInput aria-label={`${label} (${t('units.ft')})`} inputMode="numeric" className={cn(fieldCls(!!error), 'w-full')} value={p ? p.ft : ''} onText={(x) => onChange(x === '' && !p ? '' : r1(ftInToCm(Number(x) || 0, p?.inch ?? 0)))} />
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-small text-muted">{t('units.ft')}</span>
        </div>
        <div className="relative">
          <DraftInput aria-label={`${label} (${t('units.in')})`} inputMode="numeric" className={cn(fieldCls(!!error), 'w-full')} value={p ? p.inch : ''} onText={(x) => onChange(r1(ftInToCm(p?.ft ?? 0, Math.min(11.9, Number(x.replace(',', '.')) || 0))))} />
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-small text-muted">{t('units.in')}</span>
        </div>
      </div>
    );
  } else if (unit === 'stlb') {
    const p = v === '' ? null : kgToStLb(v);
    fields = (
      <div className="grid flex-1 grid-cols-2 gap-2">
        <div className="relative">
          <DraftInput aria-label={`${label} (${t('units.st')})`} inputMode="numeric" className={cn(fieldCls(!!error), 'w-full')} value={p ? p.st : ''} onText={(x) => onChange(r1(stLbToKg(Number(x) || 0, p?.lb ?? 0)))} />
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-small text-muted">{t('units.st')}</span>
        </div>
        <div className="relative">
          <DraftInput aria-label={`${label} (${t('units.lb')})`} inputMode="decimal" className={cn(fieldCls(!!error), 'w-full')} value={p ? p.lb : ''} onText={(x) => onChange(r1(stLbToKg(p?.st ?? 0, Math.min(13.9, Number(x.replace(',', '.')) || 0))))} />
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-small text-muted">{t('units.lb')}</span>
        </div>
      </div>
    );
  } else {
    const shown = v === '' ? '' : unit === 'lb' ? r1(kgToLb(v)) : r1(v);
    fields = (
      <DraftInput
        key={unit}
        aria-label={`${label} (${t(`units.${unit}`)})`}
        inputMode="decimal"
        className={cn(fieldCls(!!error), 'w-full flex-1')}
        value={shown}
        onText={(x) => {
          const n = num(x);
          if (n !== '' && !Number.isFinite(n)) return;
          onChange(n === '' ? '' : unit === 'lb' ? Math.round(lbToKg(n) * 100) / 100 : n);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-small font-medium text-ink">{label}</span>
      <div className="flex items-stretch gap-2">
        {fields}
        <select aria-label={`${label}: ${t('units.unit')}`} value={unit} onChange={(e) => onUnitChange(e.target.value as HeightUnit | WeightUnit)} className={cn(fieldCls(), 'w-28 shrink-0 font-medium')}>
          {units.map((u) => (
            <option key={u} value={u}>
              {t(`units.${u}`)}
            </option>
          ))}
        </select>
      </div>
      <Slider label={`${label} ${t('units.slider')}`} min={range.min} max={range.max} step={range.step} value={v === '' ? (kind === 'height' ? 165 : 65) : Math.min(range.max, Math.max(range.min, v))} onChange={(m) => onChange(kind === 'height' ? Math.round(m * 2) / 2 : r1(m))} />
      {error && (
        <p role="alert" className="text-caption text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------- Volume with units (owner correction 9) ----------
export function VolumeInput({ label, ml, unit, onUnitChange, onChange }: { label: string; ml: number | ''; unit: VolumeUnit; onUnitChange: (u: VolumeUnit) => void; onChange: (ml: number | '') => void }) {
  const { t } = useTranslation();
  const shown = ml === '' ? '' : Math.round(mlToVolume(ml, unit) * (unit === 'ml' ? 1 : 100)) / (unit === 'ml' ? 1 : 100);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-small font-medium text-ink">{label}</span>
      <div className="flex gap-2">
        <DraftInput
          key={unit}
          aria-label={label}
          inputMode="decimal"
          className={cn(fieldCls(), 'w-full flex-1')}
          value={shown}
          onText={(x) => {
            const n = num(x);
            if (n !== '' && !Number.isFinite(n)) return;
            onChange(n === '' ? '' : Math.round(volumeToMl(n, unit)));
          }}
        />
        <select aria-label={`${label}: ${t('units.unit')}`} value={unit} onChange={(e) => onUnitChange(e.target.value as VolumeUnit)} className={cn(fieldCls(), 'w-28 shrink-0 font-medium')}>
          {(['ml', 'l', 'floz', 'cup'] as VolumeUnit[]).map((u) => (
            <option key={u} value={u}>
              {t(`units.${u}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
