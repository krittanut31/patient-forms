/**
 * Phone numbers as one string on the wire.
 *
 * The dialing code is a second control in the UI but not a second field: the
 * form stores `+66812345678`, so `PatientForm` keeps one entry per phone, the
 * progress count stays honest, and staff read a number they can dial as-is.
 * `splitPhone` puts the two controls back together when a session is restored.
 */

import rawDialCodes from "./dial-codes.json";

export type DialCode = {
  /** ISO 3166-1 alpha-2. The option value, because dial codes are not unique. */
  iso: string;
  code: string;
  country: string;
};

export const DEFAULT_ISO = "TH";
export const DEFAULT_DIAL_CODE = "+66";

/**
 * Every country, Thailand first.
 *
 * Ten dial codes are shared by more than one country — `+1` by the United
 * States and Canada, `+61` by Australia and two island territories — so the
 * select is keyed by ISO code and only displays the dial code. Moving Thailand
 * to the front is also what makes `+66` resolve back to Thailand rather than to
 * whatever else sorted first, since the reverse lookup below keeps the first
 * entry it sees.
 */
export const DIAL_CODES: DialCode[] = (() => {
  const all = rawDialCodes.map((entry) => ({
    iso: entry.code,
    code: entry.dial_code,
    country: entry.name,
  }));

  const thailand = all.filter((entry) => entry.iso === DEFAULT_ISO);
  return [...thailand, ...all.filter((entry) => entry.iso !== DEFAULT_ISO)];
})();

const BY_ISO = new Map(DIAL_CODES.map((entry) => [entry.iso, entry]));

const ISO_BY_CODE = new Map<string, string>();
for (const entry of DIAL_CODES) {
  if (!ISO_BY_CODE.has(entry.code)) ISO_BY_CODE.set(entry.code, entry.iso);
}

export const dialCodeOf = (iso: string): string =>
  BY_ISO.get(iso)?.code ?? DEFAULT_DIAL_CODE;

export const countryOf = (iso: string): string | undefined =>
  BY_ISO.get(iso)?.country;

/** Which country to show selected for a stored number. See the note above. */
export const isoOf = (code: string): string =>
  ISO_BY_CODE.get(code) ?? DEFAULT_ISO;

/** Longest first, so `+856` is not read as `+85` followed by a 6. */
const CODES_BY_LENGTH = [...new Set(DIAL_CODES.map((entry) => entry.code))].sort(
  (a, b) => b.length - a.length,
);

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
