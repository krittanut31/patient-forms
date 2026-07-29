import { FIELD_ORDER } from "@patient-forms/shared";
import type { PatientFormField } from "@patient-forms/shared";

export type FieldKind = "text" | "tel" | "email" | "date" | "textarea" | "select" | "nationality";

export type SelectOption = { value: string; label: string };

export type FieldConfig = {
  field: PatientFormField;
  label: string;
  kind: FieldKind;
  required: boolean;
  /** Shown under the label. Only where it prevents a mistake, never as filler. */
  hint?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email";
  options?: SelectOption[];
  /**
   * Selects and dates commit in one action, so their patch goes out at once.
   * Free text is debounced instead — see PATCH_DEBOUNCE_MS.
   */
  immediate: boolean;
};

const GENDERS: SelectOption[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
  { value: "undisclosed", label: "Prefer not to say" },
];

const LANGUAGES: SelectOption[] = [
  { value: "th", label: "ไทย · Thai" },
  { value: "en", label: "English" },
  { value: "zh", label: "中文 · Chinese" },
  { value: "my", label: "မြန်မာ · Burmese" },
  { value: "km", label: "ខ្មែរ · Khmer" },
  { value: "lo", label: "ລາວ · Lao" },
  { value: "ja", label: "日本語 · Japanese" },
  { value: "other", label: "Another language" },
];

const RELIGIONS: SelectOption[] = [
  { value: "buddhist", label: "Buddhist" },
  { value: "muslim", label: "Muslim" },
  { value: "christian", label: "Christian" },
  { value: "hindu", label: "Hindu" },
  { value: "sikh", label: "Sikh" },
  { value: "none", label: "None" },
  { value: "other", label: "Other" },
  { value: "undisclosed", label: "Prefer not to say" },
];

const CONFIGS: Record<PatientFormField, FieldConfig> = {
  firstName: {
    field: "firstName",
    label: "First name",
    kind: "text",
    required: true,
    autoComplete: "given-name",
    immediate: false,
  },
  middleName: {
    field: "middleName",
    label: "Middle name",
    kind: "text",
    required: false,
    autoComplete: "additional-name",
    immediate: false,
  },
  lastName: {
    field: "lastName",
    label: "Last name",
    kind: "text",
    required: true,
    autoComplete: "family-name",
    immediate: false,
  },
  dateOfBirth: {
    field: "dateOfBirth",
    label: "Date of birth",
    kind: "date",
    required: true,
    autoComplete: "bday",
    immediate: true,
  },
  gender: {
    field: "gender",
    label: "Gender",
    kind: "select",
    required: true,
    autoComplete: "sex",
    options: GENDERS,
    immediate: true,
  },
  phone: {
    field: "phone",
    label: "Phone number",
    kind: "tel",
    required: true,
    hint: "Thai mobile, for example 081 234 5678",
    autoComplete: "tel",
    inputMode: "tel",
    immediate: false,
  },
  email: {
    field: "email",
    label: "Email",
    kind: "email",
    required: false,
    autoComplete: "email",
    inputMode: "email",
    immediate: false,
  },
  address: {
    field: "address",
    label: "Address",
    kind: "textarea",
    required: true,
    autoComplete: "street-address",
    immediate: false,
  },
  preferredLanguage: {
    field: "preferredLanguage",
    label: "Preferred language",
    kind: "select",
    required: true,
    hint: "The language you would like staff to speak with you",
    options: LANGUAGES,
    immediate: true,
  },
  nationality: {
    field: "nationality",
    label: "Nationality",
    kind: "nationality",
    required: true,
    autoComplete: "country-name",
    immediate: true,
  },
  emergencyContactName: {
    field: "emergencyContactName",
    label: "Emergency contact name",
    kind: "text",
    required: false,
    autoComplete: "name",
    immediate: false,
  },
  emergencyContactRelationship: {
    field: "emergencyContactRelationship",
    label: "Emergency contact relationship",
    kind: "text",
    required: false,
    hint: "For example: daughter, husband, neighbour",
    immediate: false,
  },
  religion: {
    field: "religion",
    label: "Religion",
    kind: "select",
    required: false,
    options: RELIGIONS,
    immediate: true,
  },
};

/** The form renders straight from this, so the order lives in one place. */
export const FIELD_CONFIGS: FieldConfig[] = FIELD_ORDER.map(
  (field) => CONFIGS[field],
);

export const fieldConfig = (field: PatientFormField): FieldConfig =>
  CONFIGS[field];
