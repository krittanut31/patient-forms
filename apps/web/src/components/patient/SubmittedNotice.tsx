"use client";

import { useTranslations } from "next-intl";

export function SubmittedNotice() {
  const t = useTranslations("patient.submitted");

  return (
    <div
      role="status"
      className="rounded-panel border border-line bg-surface p-6 text-center"
    >
      <h2 className="text-xl font-semibold text-ink">{t("heading")}</h2>
      <p className="mt-3 text-md text-ink-muted">{t("body")}</p>
      <p className="mt-4 text-sm text-ink-muted">{t("correction")}</p>
    </div>
  );
}
