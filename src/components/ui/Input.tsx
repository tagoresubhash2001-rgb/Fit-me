import React, { useId } from 'react';
import { cn } from './cn';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
}

const fieldBase =
  'h-12 w-full rounded-input border bg-surface px-3.5 text-body text-ink placeholder:text-muted ' +
  'transition-colors duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ' +
  'disabled:opacity-50';

function FieldWrap({ id, label, hint, error, children }: FieldProps & { id: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-small font-medium text-ink">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-caption text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-caption text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & FieldProps;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, className, id, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <FieldWrap id={inputId} label={label} hint={hint} error={error}>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={cn(fieldBase, error ? 'border-danger' : 'border-line', className)}
        {...rest}
      />
    </FieldWrap>
  );
});

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & FieldProps;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, children, ...rest },
  ref,
) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <FieldWrap id={selectId} label={label} hint={hint} error={error}>
      <select
        ref={ref}
        id={selectId}
        aria-invalid={!!error || undefined}
        className={cn(
          fieldBase,
          'appearance-none pe-9 bg-[length:16px] bg-no-repeat bg-[position:right_12px_center] rtl:bg-[position:left_12px_center]',
          error ? 'border-danger' : 'border-line',
          className,
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235B616B' stroke-width='1.75'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {children}
      </select>
    </FieldWrap>
  );
});
