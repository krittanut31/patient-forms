import { formatPhone } from "./phone";
import type { SelectOption } from "./field-config";
import type { FieldConfig } from "./field-config";

/**
 * What staff should read, rather than what the form stores.
 *
 * Selects hold codes — `undisclosed`, `th`, `TH` — and showing those raw would
 * make a nurse translate the database on sight. Because only the code travels,
 * the label comes out in the staff member's language whatever language the
 * patient filled the form in. Free text is passed through untouched, including
 * badly formatted text, because seeing the mistake is the point.
 */
export function displayValue(
  config: FieldConfig,
  value: string,
  locale: string,
  options: SelectOption[],
): string {
  if (value === "") return "";

  if (options.length > 0) {
    const match = options.find((option) => option.value === value);
    if (match) return match.label;
    // An unknown code is shown as-is rather than hidden: it means the form and
    // this list have drifted, and that should be visible, not swallowed.
    return value;
  }

  // Stored as `+66812345678`; a space after the country code is the difference
  // between reading it off the screen and reading it twice.
  if (config.kind === "phone") return formatPhone(value);

  if (config.kind === "date") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }

  return value;
}
