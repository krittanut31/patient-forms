"use client";

import { useTranslations } from "next-intl";
import { formatTicket } from "@patient-forms/shared";

/**
 * The number is repeated here, larger than anywhere else. This is the screen
 * the patient sits holding while they wait, so it is the one that has to answer
 * "what did they say my number was" without being reloaded.
 */
export function SubmittedNotice({ ticket }: { ticket: number | null }) {
  const t = useTranslations("patient");
  const tSubmitted = useTranslations("patient.submitted");

  return (
    <div
      role="status"
      className="rounded-panel border border-line bg-surface p-6 text-center"
    >
      <h2 className="text-xl font-semibold text-ink">{tSubmitted("heading")}</h2>

      {ticket !== null && (
        <p className="mt-4">
          <span className="block text-sm text-ink-muted">
            {t("ticketLabel")}
          </span>
          <span className="tabular text-3xl font-semibold text-ink">
            {formatTicket(ticket)}
          </span>
        </p>
      )}

      <p className="mt-4 text-md text-ink-muted">{tSubmitted("body")}</p>
      <p className="mt-4 text-sm text-ink-muted">{tSubmitted("correction")}</p>
    </div>
  );
}
