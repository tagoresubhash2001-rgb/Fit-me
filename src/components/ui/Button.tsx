import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-pressed active:bg-primary-pressed',
  secondary: 'bg-surface text-ink border border-line hover:bg-raised active:bg-raised',
  destructive: 'bg-danger-subtle text-danger hover:bg-danger hover:text-on-primary active:bg-danger active:text-on-primary',
  ghost: 'bg-transparent text-ink hover:bg-raised active:bg-raised',
};

const sizes: Record<ButtonSize, string> = {
  md: 'h-12 px-5 text-body rounded-button',
  sm: 'h-9 px-3.5 text-small rounded-[10px]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, fullWidth, icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold select-none',
        'transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 aria-hidden className="h-[18px] w-[18px] animate-spin" strokeWidth={1.75} /> : icon}
      {children && <span className="min-w-0 truncate">{children}</span>}
    </button>
  );
});

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'default' | 'primary';
}

export function IconButton({ label, tone = 'default', className, children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150',
        'disabled:opacity-50',
        tone === 'primary' ? 'bg-primary text-on-primary hover:bg-primary-pressed' : 'text-muted hover:bg-raised hover:text-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
