import type { ReactNode } from "react";
import type { FieldConfig } from "@/lib/field-config";

/**
 * Optional fields are marked rather than required ones: nine of the fourteen
 * are required, so flagging those instead would put a marker on most of the
 * form and stop meaning anything.
 */
export function fieldLabel(
  config: FieldConfig,
  label: string,
  optional: string,
): ReactNode {
  if (config.required) return label;

  return (
    <span className="flex items-baseline gap-2">
      {label}
      <span className="text-xs font-normal text-ink-muted">{optional}</span>
    </span>
  );
}
