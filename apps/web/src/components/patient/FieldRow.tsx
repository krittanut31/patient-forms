"use client";

import { useMemo } from "react";
import { Controller, useFormState } from "react-hook-form";
import type { Control, UseFormRegister } from "react-hook-form";
import { NativeSelect, Select, Textarea, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useLocale, useTranslations } from "next-intl";
import type { PatientFormField } from "@patient-forms/shared";
import type { FieldConfig } from "@/lib/field-config";
import { optionsFor } from "@/lib/field-options";
import type { IntakeValues } from "@/lib/intake-schema";
import { fieldLabel } from "./field-label";
import { PhoneField } from "./PhoneField";

type Props = {
  config: FieldConfig;
  control: Control<IntakeValues>;
  register: UseFormRegister<IntakeValues>;
  onPatch: (field: PatientFormField, value: string, immediate: boolean) => void;
  onFocus: (field: PatientFormField | null) => void;
};

const MAX_AGE_YEARS = 120;

/** Letters, marks, spaces, apostrophe — the same set the schema accepts. */
const sanitizeName = (value: string) => value.replace(/[^\p{L}\p{M}' ]/gu, "");

/**
 * One field, subscribed to only its own error state.
 *
 * The whole point of keeping this in a child component: `useFormState` with a
 * `name` re-renders this row when this field's error changes and nothing else.
 * Reading `formState.errors` up in the form would re-render all fourteen fields
 * on every keystroke once any of them had been touched.
 */
export function FieldRow({
  config,
  control,
  register,
  onPatch,
  onFocus,
}: Props) {
  const { errors } = useFormState({ control, name: config.field });
  const error = errors[config.field]?.message;

  const locale = useLocale();
  const t = useTranslations("patient");
  const tFields = useTranslations("fields");
  const tOptions = useTranslations("options");

  // Recomputed once, not on every keystroke: the calendar's bounds do not move
  // while somebody is filling in a form.
  const dateBounds = useMemo(() => {
    const today = new Date();
    const floor = new Date();
    floor.setFullYear(floor.getFullYear() - MAX_AGE_YEARS);
    return { today, floor };
  }, []);

  const labelText = tFields(`${config.field}.label`);
  const hint = config.hint ? tFields(`${config.field}.hint`) : undefined;
  const label = fieldLabel(config, labelText, t("optional"));

  // Every field has one, so there is no flag on the config to check — a missing
  // key would be a loud next-intl error rather than a field that quietly loses
  // its example. Never carries meaning the label does not: the placeholder is
  // gone the moment somebody types, and it is invisible to a screen reader.
  const placeholder = tFields(`${config.field}.placeholder`);

  const options = useMemo(
    () => optionsFor(config, locale, tOptions),
    [config, locale, tOptions],
  );

  const shared = {
    label,
    description: hint,
    error,
    withAsterisk: false,
  };

  if (config.kind === "phone") {
    return (
      <Controller
        control={control}
        name={config.field}
        render={({ field }) => (
          <PhoneField
            config={config}
            label={label}
            labelText={labelText}
            hint={hint}
            placeholder={placeholder}
            value={field.value}
            error={error}
            onChange={(value) => {
              field.onChange(value);
              onPatch(config.field, value, config.immediate);
            }}
            onFocus={() => onFocus(config.field)}
            onBlur={() => {
              field.onBlur();
              onFocus(null);
            }}
          />
        )}
      />
    );
  }

  if (config.kind === "date") {
    return (
      <Controller
        control={control}
        name={config.field}
        render={({ field }) => (
          <DateInput
            {...shared}
            id={config.field}
            value={field.value === "" ? null : field.value}
            // Future dates are not reachable at all rather than typed and then
            // rejected: nobody is born tomorrow, so there is nothing to explain.
            maxDate={dateBounds.today}
            minDate={dateBounds.floor}
            // Opens on years, not on this month. A date of birth is decades
            // back, and a month grid starts that journey in the wrong place.
            defaultLevel="decade"
            defaultDate={field.value || dateBounds.today}
            // Sunday first, matching a Thai wall calendar.
            firstDayOfWeek={0}
            // Never numeric-only: 03/04/1975 means two different days depending
            // on who is reading it, and this form is filled in by both.
            valueFormat="D MMM YYYY"
            placeholder={placeholder}
            autoComplete={config.autoComplete}
            // The dropdown matches the field. What spreads the grids inside it
            // is a block of CSS in globals.css — Mantine's own `fullWidth` prop
            // does not survive the trip through `DateInput`, see the note there.
            popoverProps={{ width: "target" }}
            onChange={(value) => {
              const next = value ?? "";
              field.onChange(next);
              onPatch(config.field, next, config.immediate);
            }}
            onFocus={() => onFocus(config.field)}
            onBlur={() => {
              field.onBlur();
              onFocus(null);
            }}
          />
        )}
      />
    );
  }

  if (config.kind === "nationality") {
    return (
      <Controller
        control={control}
        name={config.field}
        render={({ field }) => (
          <Select
            {...shared}
            id={config.field}
            data={options}
            value={field.value === "" ? null : field.value}
            placeholder={placeholder}
            searchable
            allowDeselect={false}
            nothingFoundMessage={t("nationalityNoMatch")}
            autoComplete={config.autoComplete}
            onChange={(value) => {
              const next = value ?? "";
              field.onChange(next);
              onPatch(config.field, next, config.immediate);
            }}
            onFocus={() => onFocus(config.field)}
            onBlur={() => {
              field.onBlur();
              onFocus(null);
            }}
          />
        )}
      />
    );
  }

  // Everything below stays uncontrolled and registered directly, so a keystroke
  // re-renders nothing above this row.
  const registration = register(config.field);
  const registered = {
    ...registration,
    ...shared,
    id: config.field,
    autoComplete: config.autoComplete,
    onFocus: () => onFocus(config.field),
    onBlur: (
      event: React.FocusEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      void registration.onBlur(event);
      onFocus(null);
    },
    onChange: (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      if (config.charset === "name") {
        // Rewritten on the element before react-hook-form reads it, which keeps
        // the input uncontrolled and still shows the patient what was accepted.
        const cleaned = sanitizeName(event.target.value);
        if (cleaned !== event.target.value) event.target.value = cleaned;
      }
      void registration.onChange(event);
      onPatch(config.field, event.target.value, config.immediate);
    },
  };

  if (config.kind === "textarea") {
    return (
      <Textarea
        {...registered}
        placeholder={placeholder}
        rows={3}
        autosize
        minRows={3}
        maxRows={8}
      />
    );
  }

  if (config.kind === "select") {
    return (
      <NativeSelect
        {...registered}
        // A native select has no placeholder, so the empty first option is the
        // one. Left selectable rather than disabled: religion is optional, and
        // somebody who picked an answer by accident has to be able to undo it.
        data={[{ value: "", label: placeholder }, ...options]}
      />
    );
  }

  return (
    <TextInput
      {...registered}
      placeholder={placeholder}
      type={config.kind === "email" ? "email" : "text"}
      inputMode={config.inputMode}
    />
  );
}
