/**
 * The intake form the patient fills in.
 *
 * Every field is typed as `string` on purpose: `FieldPatch.value` travels over the
 * wire as a string, and patches are emitted for invalid values too, so the type
 * cannot promise a narrower shape than what actually arrives.
 */
export type PatientForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  preferredLanguage: string;
  nationality: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  emergencyContactRelationship: string;
  religion: string;
};

export type PatientFormField = keyof PatientForm;

/**
 * Display order. Follows the brief, with `emergencyContactNumber` added next to
 * the contact it belongs to — a name and a relationship with no way to ring the
 * person is not an emergency contact.
 *
 * Also the source of `totalFields`, so adding a field here moves every progress
 * count on the staff side with it.
 */
export const FIELD_ORDER = [
  "firstName",
  "middleName",
  "lastName",
  "dateOfBirth",
  "gender",
  "phone",
  "email",
  "address",
  "preferredLanguage",
  "nationality",
  "emergencyContactName",
  "emergencyContactNumber",
  "emergencyContactRelationship",
  "religion",
] as const satisfies readonly PatientFormField[];

export const REQUIRED_FIELDS = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "gender",
  "phone",
  "address",
  "preferredLanguage",
  "nationality",
] as const satisfies readonly PatientFormField[];

export const TOTAL_FIELDS = FIELD_ORDER.length;
