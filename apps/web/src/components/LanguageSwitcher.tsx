"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { SegmentedControl } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_LABEL,
  LOCALES,
} from "@/i18n/config";

const DATA = LOCALES.map((locale) => ({
  value: locale,
  label: LOCALE_LABEL[locale],
}));

/**
 * Two languages, both always visible.
 *
 * A dropdown would hide "ไทย" behind a tap from someone who cannot read the
 * label on the closed control — which is exactly the person who needs it. The
 * option names are never translated: a language is always written in itself.
 */
export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("app");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (next: string): void => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    // The messages are resolved on the server, so the cookie alone changes
    // nothing until the tree is re-rendered against it.
    startTransition(() => router.refresh());
  };

  return (
    <SegmentedControl
      value={locale}
      onChange={choose}
      data={DATA}
      size="xs"
      radius="sm"
      disabled={pending}
      aria-label={t("languageLabel")}
      styles={{ label: { minHeight: "1.75rem", paddingInline: "0.75rem" } }}
    />
  );
}
