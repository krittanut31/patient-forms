"use client";

import { useMemo, useState } from "react";
import { Group, Select, TextInput } from "@mantine/core";
import type {
  ComboboxItem,
  ComboboxParsedItem,
  OptionsFilter,
} from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { regionName } from "@/lib/countries";
import type { FieldConfig } from "@/lib/field-config";
import {
  DEFAULT_DIAL_CODE,
  DEFAULT_ISO,
  DIAL_CODES,
  dialCodeOf,
  digitsOnly,
  isoOf,
  joinPhone,
  splitPhone,
} from "@/lib/phone";
import { Field } from "./Field";

type Props = {
  config: FieldConfig;
  label: React.ReactNode;
  /** Plain text version of the label, for the select's own aria-label. */
  labelText: string;
  hint?: string;
  /** The stored value, `+66812345678`. */
  value: string;
  error?: string;
  describedBy?: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
};

/** Keyed by ISO code: ten dial codes belong to more than one country. */
const SELECT_DATA: ComboboxItem[] = DIAL_CODES.map((entry) => ({
  value: entry.iso,
  label: entry.code,
}));

const isOption = (item: ComboboxParsedItem): item is ComboboxItem =>
  "value" in item;

export function PhoneField({
  config,
  label,
  labelText,
  hint,
  value,
  error,
  describedBy,
  onChange,
  onFocus,
  onBlur,
}: Props) {
  const locale = useLocale();
  const t = useTranslations("patient");
  const parsed = useMemo(() => splitPhone(value), [value]);
  const [iso, setIso] = useState(
    value === "" ? DEFAULT_ISO : isoOf(parsed.dialCode),
  );

  /**
   * Search matches the country in the reader's language, not the label.
   *
   * The option label is the dial code alone, because that is all that fits in
   * the trigger beside the number — but nobody knows Laos by `+856`, and a Thai
   * patient looks for "ลาว". Rebuilt when the language changes.
   */
  const searchIndex = useMemo(
    () =>
      new Map(
        DIAL_CODES.map((entry) => [
          entry.iso,
          `${regionName(entry.iso, locale)} ${entry.country} ${entry.code} ${entry.iso}`.toLowerCase(),
        ]),
      ),
    [locale],
  );

  const filterByCountry: OptionsFilter = ({ options, search }) => {
    const query = search.trim().toLowerCase();
    if (query === "") return options;
    return options
      .filter(isOption)
      .filter((option) => searchIndex.get(option.value)?.includes(query));
  };

  // A restored session arrives after the first render, so follow the stored
  // code whenever there is one rather than leaving the selector on the default.
  const activeIso = value === "" ? iso : isoOf(parsed.dialCode);
  const activeCode = dialCodeOf(activeIso);

  return (
    <Field config={config} label={label} hint={hint} error={error}>
      <Group gap="xs" wrap="nowrap" align="flex-start">
        <Select
          data={SELECT_DATA}
          value={activeIso}
          onChange={(next) => {
            if (!next) return;
            setIso(next);
            onChange(joinPhone(dialCodeOf(next), parsed.national));
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          allowDeselect={false}
          searchable
          filter={filterByCountry}
          nothingFoundMessage={t("countryNoMatch")}
          aria-label={t("countryCodeFor", { field: labelText })}
          // Long enough for the five-character codes without truncating, narrow
          // enough to leave the number the wide control on a 360px phone.
          w={104}
          styles={{
            input: { paddingRight: "1.75rem" },
            // A dropdown row is a touch target like any other.
            option: { minHeight: "2.75rem", alignItems: "center" },
          }}
          // No truncation. The longest name runs past 40 characters, which does
          // not fit on one line inside a dropdown narrow enough for a 360px
          // phone, so it wraps rather than being cut.
          renderOption={({ option }) => (
            <span className="flex w-full items-baseline gap-3">
              <span className="tabular shrink-0 font-medium">{option.label}</span>
              <span className="flex-1 text-right text-xs text-ink-muted">
                {regionName(option.value, locale)}
              </span>
            </span>
          )}
          comboboxProps={{ width: 320, position: "bottom-start" }}
        />

        <TextInput
          id={config.field}
          flex={1}
          value={parsed.national}
          // Digits only, dropped as they are typed. A letter in a phone number
          // is never a near miss worth showing back to anyone.
          onChange={(event) =>
            onChange(joinPhone(activeCode, digitsOnly(event.currentTarget.value)))
          }
          onFocus={onFocus}
          onBlur={onBlur}
          error={Boolean(error)}
          inputMode="tel"
          autoComplete={config.autoComplete}
          aria-describedby={describedBy}
          placeholder={activeCode === DEFAULT_DIAL_CODE ? "081 234 5678" : undefined}
          classNames={{ input: "tabular" }}
        />
      </Group>
    </Field>
  );
}
