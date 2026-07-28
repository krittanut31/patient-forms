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
  emergencyContactRelationship: string;
  religion: string;
};

export type PatientFormField = keyof PatientForm;

/** Display order, as specified in the brief. Also the source of `totalFields`. */
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
