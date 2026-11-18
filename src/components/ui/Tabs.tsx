import React, { useLayoutEffect, useRef, useState } from 'react';
import { cn } from './cn';

export interface TabItem<T extends string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Accessible name when the label is not plain text. */
  ariaLabel?: string;
}

/**
 * Segmented control with a sliding active pill (transform only, GPU friendly; instant under reduced
 * motion). Arrow keys move between items.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  items: TabItem<NoInfer<T>>[];
  value: T;
  onChange: (id: NoInfer<T>) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const index = Math.max(
    0,
    items.findIndex((i) => i.id === value),
  );

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const btn = el.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index];
      if (btn) setPill({ x: btn.offsetLeft, w: btn.offsetWidth });
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [index, items.length]);

  const move = (dir: number) => {
    const next = items[(index + dir + items.length) % items.length];
    onChange(next.id);
    requestAnimationFrame(() => wrap.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[items.indexOf(next)]?.focus());
  };

  return (
    <div
      ref={wrap}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        const rtl = document.documentElement.dir === 'rtl';
        if (e.key === 'ArrowRight') move(rtl ? -1 : 1);
        else if (e.key === 'ArrowLeft') move(rtl ? 1 : -1);
      }}
      className={cn('relative isolate flex w-full gap-1 rounded-button bg-raised p-1', className)}
    >
      {pill && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 left-0 -z-10 rounded-[10px] bg-surface shadow-card transition-[transform,width] duration-250 ease-[var(--ease-spring)] motion-reduce:transition-none"
          style={{ width: pill.w, transform: `translateX(${pill.x}px)` }}
        />
      )}
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={active}
            aria-label={item.ariaLabel}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] px-2 text-small font-medium transition-colors duration-200 active:scale-[0.97]',
              active ? 'text-ink' : 'text-muted hover:text-ink',
              !pill && active && 'bg-surface shadow-card',
            )}
          >
            {item.icon}
            <span className="min-w-0 truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
