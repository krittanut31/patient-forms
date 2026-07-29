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
const nameMessage = (label: string) =>
  `${label} cannot contain numbers or symbols`;

const required = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`);

const optional = z.string().trim();

const nameField = (label: string, isRequired: boolean) => {
  const base = isRequired ? required(label) : optional;
  return base.refine(
    (value) => value === "" || NAME_CHARSET.test(value),
    nameMessage(label),
  );
};

/**
 * One schema per field rather than only a whole-form schema.
 *
 * Patches carry an `isValid` flag for every keystroke, including keystrokes on
 * fields the patient has not finished or blurred yet, so validity has to be
 * answerable for a single field in isolation — react-hook-form's error state
 * is not, since it only populates once a field has been touched.
 */
export const fieldSchemas = {
  firstName: nameField("First name", true),
  middleName: nameField("Middle name", false),
  lastName: nameField("Last name", true),

  dateOfBirth: required("Date of birth").pipe(
    z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), "Use a real date")
      .refine((value) => new Date(value) <= new Date(), "Date of birth cannot be in the future")
      .refine((value) => {
        const floor = new Date();
        floor.setFullYear(floor.getFullYear() - MAX_AGE_YEARS);
        return new Date(value) >= floor;
      }, `Check the year — that is over ${MAX_AGE_YEARS} years ago`),
  ),

  gender: required("Gender"),

  // The dialing code is part of the stored value, so validity depends on both
  // halves at once — see lib/phone.ts.
  phone: required("Phone number").pipe(
    z.string().refine(isStoredPhoneValid, "Check the phone number for that country"),
  ),

  email: optional.refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Please enter valid email",
  ),

  address: required("Address"),
  preferredLanguage: required("Preferred language"),
  nationality: required("Nationality"),

  emergencyContactName: optional,
  emergencyContactNumber: optional.refine(
    (value) => value === "" || isStoredPhoneValid(value),
    "Check the phone number for that country",
  ),
  emergencyContactRelationship: optional,
  religion: optional,
} satisfies Record<PatientFormField, z.ZodType<string>>;

export const intakeSchema = z.object(fieldSchemas);

export type IntakeValues = z.infer<typeof intakeSchema>;

export const emptyIntake: PatientForm = Object.fromEntries(
  FIELD_ORDER.map((field) => [field, ""]),
) as PatientForm;

/**
 * Validity of one field on its own. Used for the `isValid` flag on every patch,
 * so staff see a malformed phone number the moment it is typed.
 */
export function isFieldValid(field: PatientFormField, value: string): boolean {
  return fieldSchemas[field].safeParse(value).success;
}
