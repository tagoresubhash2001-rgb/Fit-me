import React, { useEffect, useRef } from 'react';
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
}

/** Bottom sheet on phones, centred dialog on wider screens. */
export function Sheet({ open, onClose, title, closeLabel, children, footer, className }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-scrim animate-[fade-in_200ms_ease-out]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col rounded-t-[24px] border border-line bg-surface shadow-float outline-none',
          'sm:max-w-lg sm:rounded-card animate-[sheet-in_220ms_ease-out]',
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
          <h2 className="min-w-0 text-title text-ink">{title}</h2>
          <IconButton label={closeLabel} onClick={onClose}>
            <X className="h-5 w-5" strokeWidth={1.75} />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
        {footer && <div className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
        <style>
          {
            '@keyframes sheet-in{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}@keyframes fade-in{from{opacity:0}to{opacity:1}}'
          }
        </style>
      </div>
    </div>
  );
}
