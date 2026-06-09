'use client';

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

/** Primary/secondary/danger button for the admin UI (Tailwind, not the storefront design system). */
export function AdminButton({
  variant = 'primary',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const styles = {
    primary:
      'bg-emerald-600 text-white shadow-[0_2px_10px_rgba(5,150,105,0.2)] hover:bg-emerald-500 hover:shadow-[0_4px_16px_rgba(5,150,105,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50',
    ghost:
      'border border-neutral-200 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50 hover:text-neutral-900',
    danger:
      'border border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50 hover:text-red-700',
  }[variant];
  return (
    <button
      className={cn(
        'inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-bold tracking-wide transition-all duration-200 disabled:cursor-not-allowed',
        styles,
        className,
      )}
      {...rest}
    />
  );
}

/** Labelled field wrapper. */
export function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  );
}

const fieldClass =
  'h-10 w-full rounded-xl border border-neutral-200/80 bg-white/60 px-3.5 text-sm text-neutral-900 shadow-sm outline-none backdrop-blur-md transition-all placeholder:text-neutral-400 focus:border-emerald-500/50 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 hover:border-neutral-300';

export function AdminInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldClass, props.className)} />;
}

export function AdminTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(fieldClass, 'h-auto py-2 leading-relaxed', props.className)}
    />
  );
}

export function AdminSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldClass, props.className)} />;
}

export function AdminCheckbox({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors">
      <input
        type="checkbox"
        className="size-4.5 cursor-pointer rounded border-neutral-300 bg-neutral-50 text-emerald-600 transition-colors focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-0"
        {...props}
      />
      {label}
    </label>
  );
}

/** Modal dialog used by the CRUD forms. */
export function AdminModal({
  title,
  onClose,
  children,
  size = 'lg',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Width preset. `lg` (default) for single-column forms, `xl`/`2xl` for wider layouts. */
  size?: 'lg' | 'xl' | '2xl';
}) {
  const maxWidth = { lg: 'max-w-lg', xl: 'max-w-2xl', '2xl': 'max-w-4xl' }[size];
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:p-8 transition-all"
      onClick={onClose}
    >
      <div
        className={cn('w-full rounded-2xl bg-white shadow-xl', maxWidth)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 className="text-lg font-bold tracking-tight text-neutral-900">{title}</h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/** Page heading with an optional action slot. */
export function AdminPageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex items-center justify-between gap-4">
      <h1 className="text-2xl font-black tracking-tight text-neutral-900">{title}</h1>
      {action}
    </div>
  );
}
