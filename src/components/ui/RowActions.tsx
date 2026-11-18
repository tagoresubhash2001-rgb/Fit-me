import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from './cn';
import { haptic } from './haptics';

/** "⋯" menu with Edit and Delete (owner correction 10). */
export function RowMenu({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  menuLabel,
}: {
  onEdit?: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
  menuLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  const item = 'flex min-h-11 w-full items-center gap-2.5 px-3.5 text-start text-body hover:bg-raised';
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-raised hover:text-ink"
      >
        <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} />
      </button>
      {open && (
        <div
          role="menu"
          className="glass absolute end-0 top-full z-40 mt-1 w-44 overflow-hidden rounded-input border py-1 shadow-float animate-[pop-in_150ms_ease-out]"
        >
          {onEdit && (
            <button
              type="button"
              role="menuitem"
              className={cn(item, 'text-ink')}
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
              {editLabel}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className={cn(item, 'text-danger-text')}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            {deleteLabel}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * List row with swipe actions on touch screens (swipe left to reveal Edit / Delete) and the ⋯ menu on
 * every device, so the actions are always reachable without swiping.
 */
export function SwipeRow({
  children,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  menuLabel,
  className,
}: {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
  menuLabel: string;
  className?: string;
}) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // Slide the row out before the delete lands; Undo brings it back via the live list.
  const remove = () => {
    setLeaving(true);
    setTimeout(onDelete, 190);
  };
  const start = useRef<{ x: number; y: number; base: number } | null>(null);
  const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const width = onEdit ? 144 : 72;
  const snap = (open: boolean) => setDx(open ? -width : 0);
  return (
    <li className={cn('list-enter relative overflow-hidden', leaving && 'row-leaving', className)}>
      {(dx !== 0 || dragging) && (
        <div className="absolute inset-y-0 end-0 flex">
          {onEdit && (
            <button
              type="button"
              tabIndex={dx ? 0 : -1}
              onClick={() => {
                snap(false);
                onEdit();
              }}
              className="flex w-[72px] items-center justify-center bg-raised text-small font-medium text-ink"
            >
              {editLabel}
            </button>
          )}
          <button
            type="button"
            tabIndex={dx ? 0 : -1}
            onClick={() => {
              snap(false);
              remove();
            }}
            className="flex w-[72px] items-center justify-center bg-danger text-small font-medium text-on-primary"
          >
            {deleteLabel}
          </button>
        </div>
      )}
      <div
        className="relative flex items-center gap-2 bg-surface transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${rtl ? -dx : dx}px)`, transitionDuration: dragging ? '0ms' : undefined }}
        onTouchStart={(e) => {
          start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, base: dx };
          setDragging(true);
        }}
        onTouchMove={(e) => {
          if (!start.current) return;
          const ddx = e.touches[0].clientX - start.current.x;
          const ddy = e.touches[0].clientY - start.current.y;
          if (Math.abs(ddy) > Math.abs(ddx)) return;
          const v = start.current.base + (rtl ? -ddx : ddx);
          setDx(Math.max(-width, Math.min(0, v)));
        }}
        onTouchEnd={() => {
          if (!start.current) return;
          const open = dx < -width / 2;
          if (open !== start.current.base < 0) haptic();
          start.current = null;
          setDragging(false);
          snap(open);
        }}
      >
        <div className="min-w-0 flex-1">{children}</div>
        <RowMenu onEdit={onEdit} onDelete={remove} editLabel={editLabel} deleteLabel={deleteLabel} menuLabel={menuLabel} />
      </div>
    </li>
  );
}
