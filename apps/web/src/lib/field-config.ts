import { FIELD_ORDER } from "@patient-forms/shared";
import type { PatientFormField } from "@patient-forms/shared";

export type FieldKind =
  | "text"
  | "phone"
  | "email"
  | "date"
  | "textarea"
  | "select"
  | "nationality";

export type SelectOption = { value: string; label: string };

/**
 * Which list a select draws from. The values are stored on the wire, so they
 * stay language-neutral codes — `undisclosed`, `th`, `TH` — and the label is
 * resolved per locale in `field-options.ts`.
 */
export type OptionSet = "gender" | "language" | "religion";

export type FieldConfig = {
  field: PatientFormField;
  kind: FieldKind;
  required: boolean;
  /** True when this field has a hint under the label in the message catalogue. */
  hint?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email";
  optionSet?: OptionSet;
  /**
   * Characters outside the set are dropped as they are typed rather than
   * flagged afterwards. Only for fields where the wrong character is never a
   * near miss worth showing back to the patient.
   */
  charset?: "name";
  /**
   * Selects and dates commit in one action, so their patch goes out at once.
   * Free text is debounced instead — see PATCH_DEBOUNCE_MS.
   */
  immediate: boolean;
};

/**
 * Structure only. Every string a patient reads lives in `messages/*.json`,
 * keyed by the field name, so adding a language never means editing this file.
 */
const CONFIGS: Record<PatientFormField, FieldConfig> = {
  firstName: {
    field: "firstName",
    kind: "text",
    required: true,
    autoComplete: "given-name",
    charset: "name",
    immediate: false,
  },
  middleName: {
    field: "middleName",
    kind: "text",
    required: false,
    autoComplete: "additional-name",
    charset: "name",
    immediate: false,
  },
  lastName: {
    field: "lastName",
    kind: "text",
    required: true,
    autoComplete: "family-name",
    charset: "name",
    immediate: false,
  },
  dateOfBirth: {
    field: "dateOfBirth",
    kind: "date",
    required: true,
    autoComplete: "bday",
    immediate: true,
  },
  gender: {
    field: "gender",
    kind: "select",
    required: true,
    autoComplete: "sex",
    optionSet: "gender",
    immediate: true,
  },
  phone: {
    field: "phone",
    kind: "phone",
    required: true,
    hint: true,
    autoComplete: "tel-national",
    inputMode: "tel",
    immediate: false,
  },
  email: {
    field: "email",
    kind: "email",
    required: false,
    autoComplete: "email",
    inputMode: "email",
    immediate: false,
  },
  address: {
    field: "address",
    kind: "textarea",
    required: true,
    autoComplete: "street-address",
    immediate: false,
  },
  preferredLanguage: {
    field: "preferredLanguage",
    kind: "select",
    required: true,
    hint: true,
    optionSet: "language",
    immediate: true,
  },
  nationality: {
    field: "nationality",
    kind: "nationality",
    required: true,
    autoComplete: "country",
    immediate: true,
  },
  emergencyContactName: {
    field: "emergencyContactName",
    kind: "text",
    required: false,
    autoComplete: "name",
    immediate: false,
  },
  emergencyContactNumber: {
    field: "emergencyContactNumber",
    kind: "phone",
    required: false,
    autoComplete: "tel-national",
    inputMode: "tel",
    immediate: false,
  },
  emergencyContactRelationship: {
    field: "emergencyContactRelationship",
    kind: "text",
    required: false,
    hint: true,
    immediate: false,
  },
  religion: {
    field: "religion",
    kind: "select",
    required: false,
    optionSet: "religion",
    immediate: true,
  },
};

/** The form renders straight from this, so the order lives in one place. */
export const FIELD_CONFIGS: FieldConfig[] = FIELD_ORDER.map(
  (field) => CONFIGS[field],
);

export const fieldConfig = (field: PatientFormField): FieldConfig =>
  CONFIGS[field];
