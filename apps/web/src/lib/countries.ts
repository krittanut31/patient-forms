import rawDialCodes from "./dial-codes.json";

/**
 * Country and language names come from the browser, not from a translation file.
 *
 * `Intl.DisplayNames` already knows all 242 regions in both languages, and it
 * knows them better than a hand-written table would after the first border
 * change. It also means the stored value can be an ISO code — language-neutral
 * on the wire, so a Thai patient's nationality still reads correctly on an
 * English staff screen.
 */

const regionCache = new Map<string, Intl.DisplayNames>();
const languageCache = new Map<string, Intl.DisplayNames>();

const displayNames = (
  cache: Map<string, Intl.DisplayNames>,
  locale: string,
  type: "region" | "language",
): Intl.DisplayNames => {
  const existing = cache.get(locale);
  if (existing) return existing;
  const created = new Intl.DisplayNames([locale], { type, fallback: "code" });
  cache.set(locale, created);
  return created;
};

const FALLBACK_NAME = new Map(
  rawDialCodes.map((entry) => [entry.code, entry.name]),
);

/** `"TH"` → `"Thailand"` / `"ไทย"`. */
export function regionName(iso: string, locale: string): string {
  const resolved = displayNames(regionCache, locale, "region").of(iso);
  // `of` hands the code straight back when it does not recognise it.
  if (resolved && resolved !== iso) return resolved;
  return FALLBACK_NAME.get(iso) ?? iso;
}

/** `"my"` → `"Burmese"` / `"พม่า"`. */
export function languageName(code: string, locale: string): string {
  const resolved = displayNames(languageCache, locale, "language").of(code);
  return resolved && resolved !== code ? resolved : code;
}

/**
 * The nationality list is the same 242 ISO codes the dialing codes use — one
 * source of truth, and one less list to keep in step.
 */
export const COUNTRY_CODES: string[] = [
  ...new Set(rawDialCodes.map((entry) => entry.code)),
];

export const DEFAULT_NATIONALITY = "TH";

/** Sorted by the name actually on screen, with Thailand pinned to the top. */
export function countryOptions(
  locale: string,
): { value: string; label: string }[] {
  const collator = new Intl.Collator(locale);
  const rest = COUNTRY_CODES.filter((iso) => iso !== DEFAULT_NATIONALITY)
    .map((iso) => ({ value: iso, label: regionName(iso, locale) }))
    .sort((a, b) => collator.compare(a.label, b.label));

  return [
    { value: DEFAULT_NATIONALITY, label: regionName(DEFAULT_NATIONALITY, locale) },
    ...rest,
  ];
}
