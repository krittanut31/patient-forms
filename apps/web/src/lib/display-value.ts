import type { FieldConfig } from "./field-config";

/**
 * What staff should read, rather than what the form stores.
 *
 * Selects hold codes — `undisclosed`, `th` — and showing those raw would make a
 * nurse translate the database on sight. Free text is passed through untouched,
 * including badly formatted text, because seeing the mistake is the point.
 */
export function displayValue(config: FieldConfig, value: string): string {
  if (value === "") return "";

  if (config.options) {
    const match = config.options.find((option) => option.value === value);
    if (match) return match.label;
    // An unknown code is shown as-is rather than hidden: it means the form and
    // this list have drifted, and that should be visible, not swallowed.
    return value;
  }

  if (config.kind === "date") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }

  return value;
}
