"use client";

import { useMemo } from "react";
import { Controller, useFormState } from "react-hook-form";
import type { Control, UseFormRegister } from "react-hook-form";
import { NativeSelect, Select, Textarea, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import type { PatientFormField } from "@patient-forms/shared";
import type { FieldConfig } from "@/lib/field-config";
import type { IntakeValues } from "@/lib/intake-schema";
import { NATIONALITIES } from "@/lib/nationalities";
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

  // Recomputed once, not on every keystroke: the calendar's bounds do not move
  // while somebody is filling in a form.
  const dateBounds = useMemo(() => {
    const today = new Date();
    const floor = new Date();
    floor.setFullYear(floor.getFullYear() - MAX_AGE_YEARS);
    return { today, floor };
  }, []);

  const label = fieldLabel(config);
  const shared = {
    label,
    description: config.hint,
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
            // Without this an empty field opens on `minDate` — 1900 — because
            // that is where the clamp lands when there is no value to display.
            // Everyone alive is nearer to this decade than to that one.
            defaultDate={field.value || dateBounds.today}
            // Sunday first. The default is Monday, which is right for a diary
            // and wrong for a Thai hospital calendar on the wall.
            firstDayOfWeek={0}
            // Never numeric-only: 03/04/1975 means two different days depending
            // on who is reading it, and this form is filled in by both.
            valueFormat="D MMM YYYY"
            placeholder="e.g. 4 Mar 1975"
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
            data={NATIONALITIES as string[]}
            value={field.value === "" ? null : field.value}
            searchable
            allowDeselect={false}
            nothingFoundMessage="No match — tell reception and they will add it"
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
      <Textarea {...registered} rows={3} autosize minRows={3} maxRows={8} />
    );
  }

  if (config.kind === "select") {
    return (
      <NativeSelect
        {...registered}
        data={[{ value: "", label: "Choose one" }, ...(config.options ?? [])]}
      />
    );
  }

  return (
    <TextInput
      {...registered}
      type={config.kind === "email" ? "email" : "text"}
      inputMode={config.inputMode}
    />
  );
}
