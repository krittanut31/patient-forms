import type { ReactNode } from "react";
import type { FieldConfig } from "@/lib/field-config";

type FieldProps = {
  config: FieldConfig;
  error?: string;
  children: ReactNode;
};

export const hintId = (field: string) => `${field}-hint`;
export const errorId = (field: string) => `${field}-error`;

/**
 * Label, hint and error for one field.
 *
 * Optional fields are marked rather than required ones: eight of the thirteen
 * are required, so flagging those instead would put a marker on most of the
 * form and stop meaning anything.
 */
export function Field({ config, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={config.field}
        className="flex items-baseline gap-2 text-base font-medium text-ink"
      >
        {config.label}
        {!config.required && (
          <span className="text-xs font-normal text-ink-muted">Optional</span>
        )}
      </label>

      {config.hint && (
        <p id={hintId(config.field)} className="text-sm text-ink-muted">
          {config.hint}
        </p>
      )}

      {children}

      {error && (
        <p
          id={errorId(config.field)}
          className="text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "w-full min-h-12 rounded-field border border-line bg-surface px-3 py-2 text-md text-ink " +
  "placeholder:text-ink-muted aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-wash";
