import { countryOptions, languageName } from "./countries";
import type { FieldConfig, SelectOption } from "./field-config";

const GENDER_VALUES = ["female", "male", "other", "undisclosed"] as const;

/** Codes, not names — `Intl.DisplayNames` supplies the label per locale. */
const LANGUAGE_CODES = ["th", "en", "zh", "my", "km", "lo", "ja"] as const;

const RELIGION_VALUES = [
  "buddhist",
  "muslim",
  "christian",
  "hindu",
  "sikh",
  "none",
  "other",
  "undisclosed",
] as const;

/** Reads the `options` namespace: `t("gender.female")`. */
type OptionTranslator = (key: string) => string;

/**
 * The choices for one select, in the reader's language.
 *
 * Used by the form and by the staff detail view alike — staff read the label in
 * their own language, whichever one the patient filled the form in, because
 * only the code travels between them.
 */
export function optionsFor(
  config: FieldConfig,
  locale: string,
  t: OptionTranslator,
): SelectOption[] {
  if (config.kind === "nationality") return countryOptions(locale);

  switch (config.optionSet) {
    case "gender":
      return GENDER_VALUES.map((value) => ({
        value,
        label: t(`gender.${value}`),
      }));

    case "religion":
      return RELIGION_VALUES.map((value) => ({
        value,
        label: t(`religion.${value}`),
      }));

    case "language":
      return [
        ...LANGUAGE_CODES.map((code) => ({
          value: code,
          label: languageName(code, locale),
        })),
        // Not a language, so `Intl` has nothing to say about it.
        { value: "other", label: t("language.other") },
      ];

    default:
      return [];
  }
}
