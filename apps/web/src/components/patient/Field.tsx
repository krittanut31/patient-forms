import type { ReactNode } from "react";
import type { FieldConfig } from "@/lib/field-config";

type FieldProps = {
  config: FieldConfig;
  label: ReactNode;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export const hintId = (field: string) => `${field}-hint`;
export const errorId = (field: string) => `${field}-error`;

/**
 * Label, hint and error for a field made of more than one control.
 *
 * Every single-control field uses Mantine's own `label` / `description` /
 * `error` props instead. This exists for the phone fields, where a dialing
 * code select and a number input share one label: nesting two components that
 * each build on `Input` inside a `Input.Wrapper` makes both of them claim the
 * wrapper's `inputId`, and two elements answering to the same id is a
 * genuinely broken label. Spacing and weight mirror the theme's InputWrapper
 * styles so the two paths line up.
 */
export function Field({ config, label, hint, error, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={config.field}
        className="mb-1.5 block text-base font-medium text-ink"
      >
        {label}
      </label>

      {hint && (
        <p id={hintId(config.field)} className="mb-1.5 text-sm text-ink-muted">
          {hint}
        </p>
      )}

      {children}

      {error && (
        <p id={errorId(config.field)} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
