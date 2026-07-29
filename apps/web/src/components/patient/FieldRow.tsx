"use client";

import { Controller, useFormState } from "react-hook-form";
import type { Control, UseFormRegister } from "react-hook-form";
import type { PatientFormField } from "@patient-forms/shared";
import type { FieldConfig } from "@/lib/field-config";
import type { IntakeValues } from "@/lib/intake-schema";
import { errorId, Field, hintId, inputClass } from "./Field";
import { NationalityCombobox } from "./NationalityCombobox";

type Props = {
  config: FieldConfig;
  control: Control<IntakeValues>;
  register: UseFormRegister<IntakeValues>;
  onPatch: (field: PatientFormField, value: string, immediate: boolean) => void;
  onFocus: (field: PatientFormField | null) => void;
};

/**
 * One field, subscribed to only its own error state.
 *
 * The whole point of keeping this in a child component: `useFormState` with a
 * `name` re-renders this row when this field's error changes and nothing else.
 * Reading `formState.errors` up in the form would re-render all thirteen fields
 * on every keystroke once any of them had been touched.
 */
export function FieldRow({ config, control, register, onPatch, onFocus }: Props) {
  const { errors } = useFormState({ control, name: config.field });
  const error = errors[config.field]?.message;

  const describedBy =
    [config.hint ? hintId(config.field) : null, error ? errorId(config.field) : null]
      .filter(Boolean)
      .join(" ") || undefined;

  if (config.kind === "nationality") {
    return (
      <Field config={config} error={error}>
        <Controller
          control={control}
          name={config.field}
          render={({ field }) => (
            <NationalityCombobox
              id={config.field}
              value={field.value}
              invalid={Boolean(error)}
              describedBy={describedBy}
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
      </Field>
    );
  }

  const registration = register(config.field);
  const shared = {
    ...registration,
    id: config.field,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
    className: inputClass,
    onFocus: () => onFocus(config.field),
    onBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      void registration.onBlur(event);
      onFocus(null);
    },
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
      void registration.onChange(event);
      onPatch(config.field, event.target.value, config.immediate);
    },
  };

  return (
    <Field config={config} error={error}>
      {config.kind === "textarea" ? (
        <textarea {...shared} rows={3} autoComplete={config.autoComplete} />
      ) : config.kind === "select" ? (
        <select {...shared} autoComplete={config.autoComplete}>
          <option value="">Choose one</option>
          {config.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...shared}
          type={
            config.kind === "date" ? "date" : config.kind === "tel" ? "tel" : config.kind === "email" ? "email" : "text"
          }
          inputMode={config.inputMode}
          autoComplete={config.autoComplete}
        />
      )}
    </Field>
  );
}
