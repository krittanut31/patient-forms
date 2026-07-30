import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALES } from "./config";
import type { Locale } from "./config";

/**
 * First visit has no cookie, so fall back to what the browser asks for rather
 * than to English. A patient on a Thai phone should not have to find a switcher
 * before they can read the first field.
 */
function negotiate(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    // `th-TH` and `en-GB` both count; the region is not our business.
    const base = tag.split("-")[0];
    const match = LOCALES.find((locale) => locale === base);
    if (match) return match;
  }

  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(stored)
    ? stored
    : negotiate((await headers()).get("accept-language"));

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
