import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from './cn';

export interface ComboOption {
  value: string;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  keywords?: string;
}

/**
 * Type-to-search dropdown (owner corrections 1, 4, 5). Keyboard: arrows, Enter, Escape.
 * `allowCustom` lets the user add a value that is not in the list.
 */
export function Combobox({
  label,
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  allowCustom,
  addCustomLabel,
  error,
  hint,
  className,
  id,
}: {
  label?: string;
  value: string | null;
  options: ComboOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder: string;
  emptyText: string;
  allowCustom?: boolean;
  addCustomLabel?: (q: string) => string;
  error?: string;
  hint?: string;
  className?: string;
  id?: string;
}) {
  const auto = useId();
  const baseId = id ?? auto;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return options;
    const starts = options.filter((o) => o.label.toLowerCase().startsWith(n));
    const rest = options.filter((o) => !starts.includes(o) && `${o.label} ${o.keywords ?? ''} ${o.value}`.toLowerCase().includes(n));
    return [...starts, ...rest];
  }, [q, options]);
  const showCustom = allowCustom && q.trim() && !options.some((o) => o.label.toLowerCase() === q.trim().toLowerCase());
  const total = filtered.length + (showCustom ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    inputRef.current?.focus();
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQ('');
  };

  return (
    <div ref={wrapRef} className={cn('relative flex w-full flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={`${baseId}-btn`} className="text-small font-medium text-ink">
          {label}
        </label>
      )}
      <button
        id={`${baseId}-btn`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-12 w-full items-center gap-2 rounded-input border bg-surface px-3.5 text-start text-body text-ink transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20',
          error ? 'border-danger' : open ? 'border-primary' : 'border-line',
        )}
      >
        {selected?.icon}
        <span className={cn('min-w-0 flex-1 truncate', !selected && !value && 'text-muted')}>{selected?.label ?? value ?? placeholder}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted transition-transform duration-200', open && 'rotate-180')} strokeWidth={1.75} />
      </button>
      {open && (
        <div className="glass absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-input border shadow-float animate-[pop-in_150ms_ease-out]">
          <div className="relative border-b border-line">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.75} />
            <input
              ref={inputRef}
              role="combobox"
              aria-controls={`${baseId}-list`}
              aria-expanded
              aria-activedescendant={total ? `${baseId}-opt-${active}` : undefined}
              placeholder={searchPlaceholder}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((a) => Math.min(total - 1, a + 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((a) => Math.max(0, a - 1));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (active < filtered.length) pick(filtered[active].value);
                  else if (showCustom) pick(q.trim());
                } else if (e.key === 'Escape') setOpen(false);
              }}
              className="h-11 w-full bg-transparent ps-9 pe-3 text-body text-ink placeholder:text-muted focus:outline-none"
            />
          </div>
          <ul id={`${baseId}-list`} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.map((o, i) => (
              <li
                key={o.value}
                id={`${baseId}-opt-${i}`}
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o.value)}
                className={cn('flex min-h-11 cursor-pointer items-center gap-2.5 px-3 text-body text-ink', i === active && 'bg-primary-subtle')}
              >
                {o.icon}
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint && <span className="shrink-0 text-caption text-muted">{o.hint}</span>}
                {o.value === value && <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />}
              </li>
            ))}
            {showCustom && (
              <li
                id={`${baseId}-opt-${filtered.length}`}
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(q.trim())}
                className={cn('flex min-h-11 cursor-pointer items-center px-3 text-body font-medium text-primary', active === filtered.length && 'bg-primary-subtle')}
              >
                {addCustomLabel ? addCustomLabel(q.trim()) : q.trim()}
              </li>
            )}
            {!total && <li className="px-3 py-3 text-small text-muted">{emptyText}</li>}
          </ul>
        </div>
      )}
      {error ? (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-caption text-muted">{hint}</p>
      )}
    </div>
  );
}
