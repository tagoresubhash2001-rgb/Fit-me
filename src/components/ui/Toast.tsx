import React from 'react';
import { create } from 'zustand';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from './cn';

export type ToastTone = 'success' | 'error' | 'info';
export interface ToastAction {
  label: string;
  onClick: () => void;
}
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  action?: ToastAction;
}
interface ToastState {
  toasts: ToastItem[];
  show: (message: string, tone?: ToastTone, action?: ToastAction) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;
export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, tone = 'success', action) => {
    const id = nextId++;
    set({ toasts: [...get().toasts.slice(-2), { id, message, tone, action }] });
    setTimeout(() => get().dismiss(id), action ? 6000 : 3500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Imperative helper for non-React code. */
export const toast = (message: string, tone?: ToastTone, action?: ToastAction) => useToast.getState().show(message, tone, action);

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const toneClass = { success: 'text-primary-text', error: 'text-danger-text', info: 'text-muted' };

export function ToastViewport() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[max(12px,env(safe-area-inset-top))] z-[100] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((item) => {
        const Icon = icons[item.tone];
        return (
          <div
            key={item.id}
            role={item.tone === 'error' ? 'alert' : 'status'}
            className="glass pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-card border p-3.5 shadow-float animate-[sheet-in_200ms_ease-out]"
          >
            <Icon className={cn('h-[18px] w-[18px] shrink-0', toneClass[item.tone])} strokeWidth={1.75} />
            <p className="min-w-0 flex-1 text-small text-ink">{item.message}</p>
            {item.action && (
              <button
                type="button"
                className="shrink-0 rounded-[10px] px-2.5 py-1.5 text-small font-semibold text-primary-text hover:bg-primary-subtle"
                onClick={() => {
                  item.action!.onClick();
                  dismiss(item.id);
                }}
              >
                {item.action.label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
