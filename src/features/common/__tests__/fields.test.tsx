import React, { useState } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { initI18n } from '../../../lib/i18n';
import { DobPicker, dobToIso, MeasureInput, type DobValue } from '../fields';
import type { HeightUnit, WeightUnit } from '../../../domain/units';
import { QuantityEditor, quantityResult, type QuantityState } from '../../food/QuantityEditor';
import { unitOptionsFor, GENERIC_UNITS } from '../../../domain/quantity';

const TODAY = '2026-11-17';
beforeAll(async () => {
  await initI18n();
});

function DobHarness({ initial }: { initial: DobValue }) {
  const [v, setV] = useState(initial);
  return (
    <>
      <DobPicker value={v} onChange={setV} todayIso={TODAY} showError />
      <output data-testid="iso">{dobToIso(v) ?? ''}</output>
    </>
  );
}

describe('DobPicker', () => {
  it('limits days to the month and leap year and clamps the day', async () => {
    const u = userEvent.setup();
    render(<DobHarness initial={{ y: 2000, m: 1, d: 31 }} />);
    await u.selectOptions(screen.getByLabelText('Month'), '2');
    expect(screen.getByTestId('iso')).toHaveTextContent('2000-02-29');
    expect(within(screen.getByLabelText('Day')).getAllByRole('option')).toHaveLength(30); // placeholder + 29
    await u.selectOptions(screen.getByLabelText('Year'), '2001');
    expect(screen.getByTestId('iso')).toHaveTextContent('2001-02-28');
  });
  it('shows the live age and newest years first', () => {
    render(<DobHarness initial={{ y: 1990, m: 6, d: 15 }} />);
    expect(screen.getByText('Age 36')).toBeInTheDocument();
    const years = within(screen.getByLabelText('Year')).getAllByRole('option');
    expect(Number(years[1].textContent)).toBeGreaterThan(Number(years[2].textContent));
  });
  it('blocks users younger than 13', () => {
    render(<DobHarness initial={{ y: 2020, m: 1, d: 1 }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('at least 13');
  });
});

function MeasureHarness({ kind, unit: u0, value }: { kind: 'height' | 'weight'; unit: HeightUnit | WeightUnit; value: number }) {
  const [v, setV] = useState<number | ''>(value);
  const [unit, setUnit] = useState(u0);
  return (
    <>
      <MeasureInput kind={kind} label={kind === 'height' ? 'Height' : 'Weight'} valueMetric={v} unit={unit} onUnitChange={setUnit} onChange={setV} />
      <output data-testid="metric">{v}</output>
    </>
  );
}

describe('MeasureInput', () => {
  it('converts height instantly between cm and ft + in, keeping metric storage', async () => {
    const u = userEvent.setup();
    render(<MeasureHarness kind="height" unit="cm" value={180} />);
    await u.selectOptions(screen.getByLabelText('Height: Unit'), 'ftin');
    expect(screen.getByLabelText('Height (ft)')).toHaveValue('5');
    expect(screen.getByLabelText('Height (in)')).toHaveValue('11');
    expect(screen.getByTestId('metric')).toHaveTextContent('180');
  });
  it('accepts weight in pounds and stores kilograms', async () => {
    const u = userEvent.setup();
    render(<MeasureHarness kind="weight" unit="lb" value={70} />);
    const input = screen.getByLabelText('Weight (lb)');
    await u.clear(input);
    await u.type(input, '154');
    expect(Number(screen.getByTestId('metric').textContent)).toBeCloseTo(69.85, 2);
    await u.selectOptions(screen.getByLabelText('Weight: Unit'), 'stlb');
    expect(screen.getByLabelText('Weight (st)')).toHaveValue('11');
  });
});

const per100g = { calories: 200, proteinG: 10, carbsG: 20, fatG: 5, fiberG: 2 };
const labels = Object.fromEntries(GENERIC_UNITS.map((x) => [x, x])) as Record<(typeof GENERIC_UNITS)[number], string>;
const options = unitOptionsFor({ servings: [{ label: '1 roti', grams: 40 }] }, labels, 'en');

function QtyHarness() {
  const [s, setS] = useState<QuantityState>({ unitId: 'g', quantity: 100 });
  const r = quantityResult(per100g, options, s);
  return (
    <>
      <QuantityEditor options={options} state={s} onChange={setS} />
      <output data-testid="kcal">{Math.round(r.nutrients.calories)}</output>
    </>
  );
}

describe('QuantityEditor', () => {
  it('updates nutrition live with the stepper, multiplier chips and unit switch', async () => {
    const u = userEvent.setup();
    render(<QtyHarness />);
    expect(screen.getByTestId('kcal')).toHaveTextContent('200');
    await u.click(screen.getByRole('button', { name: 'Increase' }));
    expect(screen.getByTestId('kcal')).toHaveTextContent('220');
    await u.selectOptions(screen.getByLabelText('Unit'), 'own-0');
    // 110 g is kept and shown as roti (40 g), rounded to the 0.5 step: 3 roti = 120 g
    expect(screen.getByLabelText('Quantity')).toHaveValue('3');
    expect(screen.getByTestId('kcal')).toHaveTextContent('240');
    await u.click(screen.getByRole('button', { name: '2×' }));
    expect(screen.getByTestId('kcal')).toHaveTextContent('160');
  });
});
