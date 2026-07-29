"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Stack } from "@mantine/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { PatientForm, PatientFormField } from "@patient-forms/shared";
import { DEFAULT_NATIONALITY } from "@/lib/countries";
import { FIELD_CONFIGS } from "@/lib/field-config";
import { createIntakeSchema, emptyIntake } from "@/lib/intake-schema";
import type { IntakeValues } from "@/lib/intake-schema";
import { usePatientSession } from "@/lib/use-patient-session";
import { ConnectionNotice } from "./ConnectionNotice";
import { FieldRow } from "./FieldRow";
import { SubmittedNotice } from "./SubmittedNotice";

const DEFAULTS: IntakeValues = {
  ...emptyIntake,
  nationality: DEFAULT_NATIONALITY,
};

export function IntakeForm() {
  const [submitted, setSubmitted] = useState(false);
  const restoredRef = useRef(false);

  const t = useTranslations("patient");
  const tFields = useTranslations("fields");
  const tValidation = useTranslations("validation");

  // Rebuilt when the language changes, so a message already on screen switches
  // with everything else rather than sitting there in the old language.
  const schema = useMemo(
    () =>
      createIntakeSchema({
        t: (key, values) => tValidation(key, values),
        label: (field) => tFields(`${field}.label`),
      }),
    [tValidation, tFields],
  );

  const form = useForm<IntakeValues>({
    resolver: zodResolver(schema),
    // Nothing is flagged until the patient leaves the field; after that it
    // re-checks as they type, so a correction clears the message immediately.
    mode: "onTouched",
    defaultValues: DEFAULTS,
  });

  const { control, register, getValues, handleSubmit, reset } = form;

  const session = usePatientSession();
  const { restored, resyncToken, patch, sendAll } = session;

  useEffect(() => {
    if (!restored || restoredRef.current) return;
    restoredRef.current = true;

    const values = { ...DEFAULTS };
    for (const [field, state] of Object.entries(restored)) {
      values[field as PatientFormField] = state.value;
    }
    reset(values);

    // Anything pre-filled that the server has never seen — the default
    // nationality on a first visit — is pushed now, so the staff list is not
    // showing a blank field the patient can see filled in.
    for (const [field, value] of Object.entries(values) as [
      PatientFormField,
      string,
    ][]) {
      if (value === "" || field in restored) continue;
      patch(field, value, true);
    }
  }, [restored, reset, patch]);

  // The connection came back. The form is the only place the values typed while
  // it was down still exist, so hand them over.
  useEffect(() => {
    if (resyncToken === 0) return;
    sendAll(getValues() as PatientForm);
  }, [resyncToken, sendAll, getValues]);

  if (submitted) return <SubmittedNotice />;

  return (
    <form
      noValidate
      onSubmit={handleSubmit(() => {
        session.submit();
        setSubmitted(true);
      })}
      className="flex flex-col gap-6"
    >
      <ConnectionNotice state={session.connection} />

      {/* Single column at every width — a two-column form on a phone is how
          people miss a field entirely. */}
      <Stack gap="lg">
        {FIELD_CONFIGS.map((config) => (
          <FieldRow
            key={config.field}
            config={config}
            control={control}
            register={register}
            onPatch={session.patch}
            onFocus={session.focus}
          />
        ))}
      </Stack>

      <Button type="submit" fullWidth fw={600}>
        {t("submit")}
      </Button>

      <p className="text-sm text-ink-muted">{t("privacy")}</p>
    </form>
  );
}
