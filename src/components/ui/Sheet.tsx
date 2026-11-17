import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import { cn } from './cn';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  closeLabel: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /**
   * Render in place as a panel (for the detail side of a split view on tablet and desktop)
   * instead of a modal. The same form, one source, every screen size.
   */
  inline?: boolean;
  /** Dialog width on tablet and desktop. */
  size?: 'md' | 'lg';
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Bottom sheet on phones; centred dialog (max 560 px) with a dimmed glass backdrop from 768 px.
 * Esc closes, focus is trapped inside and returned to the opener on close.
 */
export function Sheet({ open, onClose, title, closeLabel, children, footer, className, inline, size = 'md' }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Keep the latest onClose without re-running the open effect on every parent render
  // (re-running it would steal focus from inputs inside the sheet).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open || inline) return;
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open, inline]);

  if (!open) return null;

  const header = (
    <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2 md:px-5">
      <h2 id={titleId} className="min-w-0 text-title text-ink">
        {title}
      </h2>
      <IconButton label={closeLabel} onClick={onClose}>
        <X className="h-5 w-5" strokeWidth={1.75} />
      </IconButton>
    </div>
  );

  if (inline) {
    return (
      <section aria-labelledby={titleId} className={cn('card-enter flex min-h-0 flex-col rounded-card border border-card-border bg-surface shadow-card', className)}>
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 md:px-5">{children}</div>
        {footer && <div className="border-t border-line p-4 md:px-5">{footer}</div>}
      </section>
    );
  }

  // Portal to <body> so animated (transformed) screen containers never trap the sheet under the nav.
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center md:p-6">
      <div className="absolute inset-0 bg-scrim backdrop-blur-[2px] animate-[fade-in_200ms_ease-out]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'glass relative flex max-h-[92dvh] w-full flex-col rounded-t-[24px] border shadow-float outline-none',
          'md:max-h-[86dvh] md:rounded-card animate-[sheet-in_220ms_ease-out] md:animate-[pop-in_200ms_ease-out]',
          size === 'lg' ? 'md:max-w-[720px]' : 'md:max-w-[560px]',
          className,
        )}
      >
        {header}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 md:px-5">{children}</div>
        {footer && <div className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-5 md:pb-4">{footer}</div>}
        <style>
          {
            '@keyframes sheet-in{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}@keyframes fade-in{from{opacity:0}to{opacity:1}}'
          }
        </style>
      </div>
    </div>,
    document.body,
  );
}
