import { z } from "zod";
import { FIELD_ORDER } from "@patient-forms/shared";
import type { PatientForm, PatientFormField } from "@patient-forms/shared";

const MAX_AGE_YEARS = 120;

/** Accepts 08x, 06x, 09x and +66 forms, with spaces, dashes or parens. */
const THAI_MOBILE = /^(?:\+?66|0)[689]\d{8}$/;
const stripPunctuation = (value: string) => value.replace(/[\s\-().]/g, "");

const required = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`);

const optional = z.string().trim();

/**
 * One schema per field rather than only a whole-form schema.
 *
 * Patches carry an `isValid` flag for every keystroke, including keystrokes on
 * fields the patient has not finished or blurred yet, so validity has to be
 * answerable for a single field in isolation — react-hook-form's error state
 * is not, since it only populates once a field has been touched.
 */
export const fieldSchemas = {
  firstName: required("First name"),
  middleName: optional,
  lastName: required("Last name"),

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

  phone: required("Phone number").pipe(
    z
      .string()
      .refine(
        (value) => THAI_MOBILE.test(stripPunctuation(value)),
        "Enter a Thai mobile number, for example 081 234 5678",
      ),
  ),

  email: optional.refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Check the email address",
  ),

  address: required("Address"),
  preferredLanguage: required("Preferred language"),
  nationality: required("Nationality"),

  emergencyContactName: optional,
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
