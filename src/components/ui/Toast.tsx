import React from 'react';
import { create } from 'zustand';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from './cn';

export type ToastTone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}
interface ToastState {
  toasts: ToastItem[];
  show: (message: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;
export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, tone = 'success') => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, message, tone }] });
    setTimeout(() => get().dismiss(id), 3500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Imperative helper for non-React code. */
export const toast = (message: string, tone?: ToastTone) => useToast.getState().show(message, tone);

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const toneClass = { success: 'text-primary', error: 'text-danger', info: 'text-muted' };

export function ToastViewport() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onClose={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const Icon = icons[item.tone];
  return (
    <div
      role={item.tone === 'error' ? 'alert' : 'status'}
      onClick={onClose}
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-line bg-surface p-3.5 shadow-float animate-[toast-in_200ms_ease-out]"
    >
      <Icon className={cn('mt-0.5 h-[18px] w-[18px] shrink-0', toneClass[item.tone])} strokeWidth={1.75} />
      <p className="text-small text-ink">{item.message}</p>
      <style>{'@keyframes toast-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}'}</style>
    </div>
  );
}
