import type { InputHTMLAttributes } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Span the full width of a field grid. */
  wide?: boolean;
  /** Optional hint shown under the input. */
  hint?: string;
}

/** Labelled text input. Mirrors the prototype's `Field`. */
export function Field({ label, wide, hint, ...rest }: FieldProps) {
  return (
    <label className={`field ${wide ? 'field-wide' : ''}`}>
      <span>{label}</span>
      <input {...rest} />
      {hint && <i className="field-hint">{hint}</i>}
    </label>
  );
}
