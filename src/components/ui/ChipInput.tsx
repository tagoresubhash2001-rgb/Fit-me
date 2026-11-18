import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { cn } from './cn';
import { Combobox, type ComboOption } from './Combobox';

/**
 * Multi-select with suggestion chips, a searchable longer list and free typing (owner correction 4).
 * Selected values show as removable chips.
 */
export function ChipInput({
  label,
  values,
  onChange,
  suggestions,
  moreOptions,
  labelFor,
  addLabel,
  inputPlaceholder,
  searchLabel,
  searchPlaceholder,
  emptyText,
  removeLabel,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  suggestions: string[];
  moreOptions: string[];
  labelFor: (v: string) => string;
  addLabel: string;
  inputPlaceholder: string;
  searchLabel: string;
  searchPlaceholder: string;
  emptyText: string;
  removeLabel: (v: string) => string;
}) {
  const [text, setText] = useState('');
  const toggle = (v: string) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  const addCustom = () => {
    const v = text.trim().slice(0, 40);
    if (v && !values.some((x) => labelFor(x).toLowerCase() === v.toLowerCase())) onChange([...values, v]);
    setText('');
  };
  const options: ComboOption[] = [...suggestions, ...moreOptions]
    .filter((v) => !values.includes(v))
    .map((v) => ({ value: v, label: labelFor(v) }));
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-1 text-small font-medium text-ink">{label}</legend>
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-live="polite">
          {values.map((v) => (
            <li
              key={v}
              className="list-enter flex h-9 items-center gap-1 rounded-full bg-primary px-3 text-small font-medium text-on-primary"
            >
              <span className="max-w-[12rem] truncate">{labelFor(v)}</span>
              <button
                type="button"
                aria-label={removeLabel(labelFor(v))}
                onClick={() => toggle(v)}
                className="-me-1 rounded-full p-1 hover:bg-primary-pressed"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((v) => {
          const on = values.includes(v);
          return (
            <button
              key={v}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(v)}
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-full border px-3 text-small transition-colors duration-150 active:scale-95',
                on ? 'border-primary bg-primary-subtle text-primary-text' : 'border-line bg-surface text-ink hover:bg-raised',
              )}
            >
              {on ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2} />}
              {labelFor(v)}
            </button>
          );
        })}
      </div>
      <Combobox
        label={searchLabel}
        value={null}
        options={options}
        onChange={(v) => (options.some((o) => o.value === v) ? toggle(v) : onChange([...values, v]))}
        placeholder={searchPlaceholder}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        allowCustom
        addCustomLabel={(q) => `${addLabel}: ${q}`}
      />
      <div className="flex gap-2">
        <input
          aria-label={inputPlaceholder}
          placeholder={inputPlaceholder}
          value={text}
          maxLength={40}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
          className="h-12 min-w-0 flex-1 rounded-input border border-line bg-surface px-3.5 text-body text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!text.trim()}
          className="h-12 shrink-0 rounded-button border border-line bg-surface px-4 text-body font-semibold text-ink hover:bg-raised disabled:opacity-50"
        >
          {addLabel}
        </button>
      </div>
    </fieldset>
  );
}
