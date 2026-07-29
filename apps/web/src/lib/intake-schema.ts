import { z } from "zod";
import { FIELD_ORDER } from "@patient-forms/shared";
import type { PatientForm, PatientFormField } from "@patient-forms/shared";
import { isStoredPhoneValid } from "./phone";

const MAX_AGE_YEARS = 120;

/**
 * Letters, combining marks, spaces and the apostrophe. Nothing else.
 *
 * `\p{M}` is not optional: Thai vowels and tone marks are combining marks, and
 * a letters-only rule without it rejects most Thai names outright. The
 * apostrophe survives for O'Brien and d'Souza; hyphens and full stops do not,
 * which is the rule as specified.
 */
const NAME_CHARSET = /^[\p{L}\p{M}' ]+$/u;

/**
 * How a schema gets its messages.
 *
 * The rules are the same in every language; only the wording changes. Passing
 * the words in rather than baking them in is what lets the same file answer
 * "is this value valid" without a translator present — see `isFieldValid`.
 */
export type ValidationCopy = {
  t: (key: string, values?: Record<string, string | number>) => string;
  label: (field: PatientFormField) => string;
};

export function createFieldSchemas(
  copy: ValidationCopy,
  // Both parameters matter: `ZodType<string>` alone leaves the *input* type as
  // `unknown`, and zodResolver then infers a form whose every field is unknown.
): Record<PatientFormField, z.ZodType<string, string>> {
  const required = (field: PatientFormField) =>
    z
      .string()
      .trim()
      .min(1, copy.t("required", { field: copy.label(field) }));

  const optional = z.string().trim();

  const nameField = (field: PatientFormField, isRequired: boolean) => {
    const base = isRequired ? required(field) : optional;
    return base.refine(
      (value) => value === "" || NAME_CHARSET.test(value),
      copy.t("nameCharset", { field: copy.label(field) }),
    );
  };

  return {
    firstName: nameField("firstName", true),
    middleName: nameField("middleName", false),
    lastName: nameField("lastName", true),

    dateOfBirth: required("dateOfBirth").pipe(
      z
        .string()
        .refine((value) => !Number.isNaN(Date.parse(value)), copy.t("realDate"))
        .refine(
          (value) => new Date(value) <= new Date(),
          copy.t("futureDate"),
        )
        .refine((value) => {
          const floor = new Date();
          floor.setFullYear(floor.getFullYear() - MAX_AGE_YEARS);
          return new Date(value) >= floor;
        }, copy.t("tooLongAgo", { years: MAX_AGE_YEARS })),
    ),

    gender: required("gender"),

    // The dialing code is part of the stored value, so validity depends on both
    // halves at once — see lib/phone.ts.
    phone: required("phone").pipe(
      z.string().refine(isStoredPhoneValid, copy.t("phone")),
    ),

    email: optional.refine(
      (value) => value === "" || z.email().safeParse(value).success,
      copy.t("email"),
    ),

    address: required("address"),
    preferredLanguage: required("preferredLanguage"),
    nationality: required("nationality"),

    emergencyContactName: optional,
    emergencyContactNumber: optional.refine(
      (value) => value === "" || isStoredPhoneValid(value),
      copy.t("phone"),
    ),
    emergencyContactRelationship: optional,
    religion: optional,
  };
}

export const createIntakeSchema = (copy: ValidationCopy) =>
  z.object(createFieldSchemas(copy));

export type IntakeValues = Record<PatientFormField, string>;

/**
 * The same rules with the messages left blank.
 *
 * Every patch carries an `isValid` flag, including for fields nobody has
 * blurred yet, and that flag is computed outside React — where there is no
 * translator to hand and no need for one, because a boolean does not have a
 * language.
 */
const SILENT: ValidationCopy = { t: () => "", label: () => "" };
const validityRules = createFieldSchemas(SILENT);

export function isFieldValid(field: PatientFormField, value: string): boolean {
  return validityRules[field].safeParse(value).success;
}

export const emptyIntake: PatientForm = Object.fromEntries(
  FIELD_ORDER.map((field) => [field, ""]),
) as PatientForm;
