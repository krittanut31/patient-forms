/**
 * Phone numbers as one string on the wire.
 *
 * The dialing code is a second control in the UI but not a second field: the
 * form stores `+66812345678`, so `PatientForm` keeps one entry per phone, the
 * progress count stays honest, and staff read a number they can dial as-is.
 * `splitPhone` puts the two controls back together when a session is restored.
 */

export type DialCode = {
  code: string;
  country: string;
};

/**
 * The countries an outpatient department in Bangkok actually sees, then the
 * large ones. Not the full ITU list — a scrolling list of 200 is slower to use
 * than typing, and the wrong code is worse than no code.
 */
export const DIAL_CODES: DialCode[] = [
  { code: "+66", country: "Thailand" },
  { code: "+95", country: "Myanmar" },
  { code: "+856", country: "Laos" },
  { code: "+855", country: "Cambodia" },
  { code: "+84", country: "Vietnam" },
  { code: "+60", country: "Malaysia" },
  { code: "+65", country: "Singapore" },
  { code: "+62", country: "Indonesia" },
  { code: "+63", country: "Philippines" },
  { code: "+86", country: "China" },
  { code: "+852", country: "Hong Kong" },
  { code: "+886", country: "Taiwan" },
  { code: "+81", country: "Japan" },
  { code: "+82", country: "South Korea" },
  { code: "+91", country: "India" },
  { code: "+7", country: "Russia" },
  { code: "+971", country: "United Arab Emirates" },
  { code: "+966", country: "Saudi Arabia" },
  { code: "+61", country: "Australia" },
  { code: "+64", country: "New Zealand" },
  { code: "+44", country: "United Kingdom" },
  { code: "+353", country: "Ireland" },
  { code: "+33", country: "France" },
  { code: "+49", country: "Germany" },
  { code: "+39", country: "Italy" },
  { code: "+34", country: "Spain" },
  { code: "+31", country: "Netherlands" },
  { code: "+41", country: "Switzerland" },
  { code: "+46", country: "Sweden" },
  { code: "+47", country: "Norway" },
  { code: "+45", country: "Denmark" },
  { code: "+1", country: "United States / Canada" },
];

export const DEFAULT_DIAL_CODE = "+66";

/** Longest first, so `+856` is not read as `+85` followed by a 6. */
const CODES_BY_LENGTH = [...DIAL_CODES]
  .map((entry) => entry.code)
  .sort((a, b) => b.length - a.length);

export const digitsOnly = (value: string): string => value.replace(/\D/g, "");

/**
 * Thai mobiles are `08x`, `09x`, `06x`. The leading zero is a domestic trunk
 * prefix and is dropped when the country code is present, but patients type it
 * out of habit, so both are accepted and neither is corrected under them.
 */
const THAI_MOBILE = /^0?[689]\d{8}$/;

/** Everything else: the ITU maximum is 15 digits including the country code. */
const INTERNATIONAL = /^\d{7,15}$/;

export function isPhoneValid(dialCode: string, national: string): boolean {
  if (national === "") return false;
  return dialCode === DEFAULT_DIAL_CODE
    ? THAI_MOBILE.test(national)
    : INTERNATIONAL.test(national);
}

/** `""` for an empty number, so an untouched field is not counted as filled. */
export function joinPhone(dialCode: string, national: string): string {
  const digits = digitsOnly(national);
  return digits === "" ? "" : `${dialCode}${digits}`;
}

export function splitPhone(value: string): {
  dialCode: string;
  national: string;
} {
  const trimmed = value.trim();

  if (trimmed.startsWith("+")) {
    const match = CODES_BY_LENGTH.find((code) => trimmed.startsWith(code));
    if (match) {
      return { dialCode: match, national: digitsOnly(trimmed.slice(match.length)) };
    }
  }

  // No recognised code — a number restored from an older session, or one typed
  // before this field grew a selector. Keep the digits, assume the default.
  return { dialCode: DEFAULT_DIAL_CODE, national: digitsOnly(trimmed) };
}

/** Validity of a stored value, for the schema and for `isValid` on a patch. */
export function isStoredPhoneValid(value: string): boolean {
  const { dialCode, national } = splitPhone(value);
  return isPhoneValid(dialCode, national);
}

export function formatPhone(value: string): string {
  const { dialCode, national } = splitPhone(value);
  if (national === "") return value;
  return `${dialCode} ${national}`;
}
