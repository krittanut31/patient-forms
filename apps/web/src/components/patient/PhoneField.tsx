"use client";

import { useMemo, useState } from "react";
import { Group, Select, TextInput } from "@mantine/core";
import type { FieldConfig } from "@/lib/field-config";
import {
  DEFAULT_DIAL_CODE,
  DIAL_CODES,
  digitsOnly,
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

const COUNTRY_BY_CODE = new Map(
  DIAL_CODES.map((entry) => [entry.code, entry.country]),
);

const SELECT_DATA = DIAL_CODES.map((entry) => ({
  value: entry.code,
  label: entry.code,
}));

/**
 * Dialing code and number, stored as one string.
 *
 * The code lives in local state as well as in the stored value because the two
 * are not the same thing: picking `+65` before typing any digits has to stick
 * on screen, but it must not write `+65` into a field the patient has left
 * empty — that would count as filled on the staff list and read as progress
 * that never happened.
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
  const [dialCode, setDialCode] = useState(
    value === "" ? DEFAULT_DIAL_CODE : parsed.dialCode,
  );

  // A restored session arrives after the first render, so follow the stored
  // code whenever there is one rather than leaving the selector on the default.
  const activeCode = value === "" ? dialCode : parsed.dialCode;

  return (
    <Field config={config} error={error}>
      <Group gap="xs" wrap="nowrap" align="flex-start">
        <Select
          data={SELECT_DATA}
          value={activeCode}
          onChange={(next) => {
            if (!next) return;
            setDialCode(next);
            onChange(joinPhone(next, parsed.national));
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          allowDeselect={false}
          searchable
          nothingFoundMessage="No country code"
          aria-label={`${config.label} country code`}
          // Long enough for +856 without truncating, narrow enough to leave the
          // number itself the wide control on a 360px phone.
          w={104}
          styles={{ input: { paddingRight: "1.75rem" } }}
          renderOption={({ option }) => (
            <span className="flex w-full items-baseline justify-between gap-3">
              <span className="tabular font-medium">{option.value}</span>
              <span className="text-xs text-ink-muted">
                {COUNTRY_BY_CODE.get(option.value)}
              </span>
            </span>
          )}
          comboboxProps={{ width: 260, position: "bottom-start" }}
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
