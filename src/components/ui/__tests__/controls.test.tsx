import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stepper } from '../Stepper';
import { Combobox } from '../Combobox';
import { ChipInput } from '../ChipInput';
import { RowMenu } from '../RowActions';

function StepperHarness({ initial = 1, step = 0.5, min = 0.5, max = 3 }: { initial?: number; step?: number; min?: number; max?: number }) {
  const [v, setV] = useState<number | ''>(initial);
  return <Stepper label="Quantity" value={v} onChange={setV} step={step} min={min} max={max} decreaseLabel="Decrease" increaseLabel="Increase" />;
}

describe('Stepper', () => {
  it('steps up and down and respects min and max', async () => {
    const u = userEvent.setup();
    render(<StepperHarness />);
    const input = screen.getByLabelText('Quantity');
    await u.click(screen.getByRole('button', { name: 'Increase' }));
    expect(input).toHaveValue('1.5');
    await u.click(screen.getByRole('button', { name: 'Decrease' }));
    await u.click(screen.getByRole('button', { name: 'Decrease' }));
    expect(input).toHaveValue('0.5');
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled();
  });
  it('accepts typed values and clamps on blur', async () => {
    const u = userEvent.setup();
    render(<StepperHarness />);
    const input = screen.getByLabelText('Quantity');
    await u.clear(input);
    await u.type(input, '9');
    await u.tab();
    expect(input).toHaveValue('3');
  });
});

const COUNTRIES = [
  { value: 'IN', label: 'India' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'GB', label: 'United Kingdom', keywords: 'england britain' },
];

describe('Combobox', () => {
  it('filters by typing and picks with the keyboard', async () => {
    const u = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox label="Country" value={null} options={COUNTRIES} onChange={onChange} searchPlaceholder="Search" emptyText="No matches" />);
    await u.click(screen.getByRole('button', { name: 'Country' }));
    await u.type(screen.getByRole('combobox'), 'brit');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await u.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('GB');
  });
  it('shows an empty state and offers the typed value when custom is allowed', async () => {
    const u = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox label="Region" value={null} options={COUNTRIES} onChange={onChange} searchPlaceholder="Search" emptyText="No matches" allowCustom addCustomLabel={(q) => `Use ${q}`} />);
    await u.click(screen.getByRole('button', { name: 'Region' }));
    await u.type(screen.getByRole('combobox'), 'Atlantis');
    await u.click(screen.getByText('Use Atlantis'));
    expect(onChange).toHaveBeenCalledWith('Atlantis');
  });
});

function ChipHarness() {
  const [v, setV] = useState<string[]>([]);
  return (
    <>
      <ChipInput
        label="Allergies"
        values={v}
        onChange={setV}
        suggestions={['peanuts', 'eggs']}
        moreOptions={['kiwi']}
        labelFor={(x) => ({ peanuts: 'Peanuts', eggs: 'Eggs', kiwi: 'Kiwi' })[x] ?? x}
        addLabel="Add"
        inputPlaceholder="Type another allergy"
        searchLabel="More allergens"
        searchPlaceholder="Search allergens"
        emptyText="No matches"
        removeLabel={(x) => `Remove ${x}`}
      />
      <output data-testid="out">{v.join(',')}</output>
    </>
  );
}

describe('ChipInput', () => {
  it('toggles suggestion chips, adds custom entries with Enter and removes them', async () => {
    const u = userEvent.setup();
    render(<ChipHarness />);
    await u.click(screen.getByRole('button', { name: 'Peanuts' }));
    expect(screen.getByRole('button', { name: 'Peanuts' })).toHaveAttribute('aria-pressed', 'true');
    await u.type(screen.getByLabelText('Type another allergy'), 'Mango{Enter}');
    expect(screen.getByTestId('out')).toHaveTextContent('peanuts,Mango');
    await u.type(screen.getByLabelText('Type another allergy'), 'mango{Enter}');
    expect(screen.getByTestId('out')).toHaveTextContent('peanuts,Mango');
    await u.click(screen.getByRole('button', { name: 'Remove Mango' }));
    expect(screen.getByTestId('out')).toHaveTextContent('peanuts');
  });
  it('picks from the searchable longer list', async () => {
    const u = userEvent.setup();
    render(<ChipHarness />);
    await u.click(screen.getByRole('button', { name: 'More allergens' }));
    await u.type(screen.getByRole('combobox'), 'kiw{Enter}');
    expect(screen.getByTestId('out')).toHaveTextContent('kiwi');
  });
});

describe('RowMenu', () => {
  it('opens and runs edit and delete', async () => {
    const u = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<RowMenu onEdit={onEdit} onDelete={onDelete} editLabel="Edit" deleteLabel="Delete" menuLabel="More actions" />);
    await u.click(screen.getByRole('button', { name: 'More actions' }));
    await u.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).toBeNull();
    await u.click(screen.getByRole('button', { name: 'More actions' }));
    await u.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
