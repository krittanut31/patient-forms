/**
 * Two languages, chosen by cookie rather than by URL.
 *
 * A patient scans the QR code at the counter and lands on the form; a nurse
 * bookmarks the staff list. Neither of them types a URL, so a `/th` prefix
 * would buy nothing and cost a redirect on every visit. The trade is that a
 * link cannot carry a language — noted in the README.
 */
export const LOCALES = ["en", "th"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

/** A year: the language someone picked is not a per-session preference. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  th: "ไทย",
};

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && LOCALES.includes(value as Locale);
