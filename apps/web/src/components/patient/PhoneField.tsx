"use client";

import { useMemo, useState } from "react";
import { Group, Select, TextInput } from "@mantine/core";
import type {
  ComboboxItem,
  ComboboxParsedItem,
  OptionsFilter,
} from "@mantine/core";
import type { FieldConfig } from "@/lib/field-config";
import {
  countryOf,
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

/** Lower-cased once at module load, not on every keystroke of a search. */
const SEARCH_INDEX = new Map(
  DIAL_CODES.map((entry) => [
    entry.iso,
    `${entry.country} ${entry.code} ${entry.iso}`.toLowerCase(),
  ]),
);

/**
 * Search matches the country, not the label.
 *
 * The option label is the dial code alone, because that is all that fits in the
 * trigger beside the number — but nobody knows Laos by `+856`. Without this,
 * typing "Laos" into a list of 242 codes finds nothing.
 */
const isOption = (item: ComboboxParsedItem): item is ComboboxItem =>
  "value" in item;

const filterByCountry: OptionsFilter = ({ options, search }) => {
  const query = search.trim().toLowerCase();
  if (query === "") return options;
  return options
    .filter(isOption)
    .filter((option) => SEARCH_INDEX.get(option.value)?.includes(query));
};

/**
 * Dialing code and number, stored as one string.
 *
 * The selected country lives in local state as well as in the stored value
 * because the two are not the same thing: picking Singapore before typing any
 * digits has to stick on screen, but it must not write `+65` into a field the
 * patient has left empty — that would count as filled on the staff list and
 * read as progress that never happened.
 */
export function PhoneField({
  config,
  value,
  error,
  describedBy,
  onChange,
  onFocus,
  onBlur,
}: Props) {
  const parsed = useMemo(() => splitPhone(value), [value]);
  const [iso, setIso] = useState(
    value === "" ? DEFAULT_ISO : isoOf(parsed.dialCode),
  );

  // A restored session arrives after the first render, so follow the stored
  // code whenever there is one rather than leaving the selector on the default.
  const activeIso = value === "" ? iso : isoOf(parsed.dialCode);
  const activeCode = dialCodeOf(activeIso);

  return (
    <Field config={config} error={error}>
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
          nothingFoundMessage="No country by that name"
          aria-label={`${config.label} country code`}
          // Long enough for the five-character codes without truncating, narrow
          // enough to leave the number the wide control on a 360px phone.
          w={104}
          styles={{
            input: { paddingRight: "1.75rem" },
            // A dropdown row is a touch target like any other.
            option: { minHeight: "2.75rem", alignItems: "center" },
          }}
          // No truncation. The longest name in the list runs to 44 characters —
          // "Korea, Democratic People's Republic of Korea" — which does not fit
          // on one line inside a dropdown narrow enough for a 360px phone, so it
          // wraps rather than being cut. Mantine's option already sets
          // `overflow-wrap: break-word`; the earlier clipping was a `truncate`
          // class of mine, not the library.
          renderOption={({ option }) => (
            <span className="flex w-full items-baseline gap-3">
              <span className="tabular shrink-0 font-medium">{option.label}</span>
              <span className="flex-1 text-right text-xs text-ink-muted">
                {countryOf(option.value)}
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
