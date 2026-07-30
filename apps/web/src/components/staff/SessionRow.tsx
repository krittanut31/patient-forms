"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { sessionCode } from "@patient-forms/shared";
import type { SessionSummary } from "@patient-forms/shared";
import { elapsedParts, formatElapsed } from "@/lib/relative-time";
import { RAIL, StatusChip } from "./StatusChip";

type Props = {
  session: SessionSummary;
  now: number;
  selected: boolean;
};

export function SessionRow({ session, now, selected }: Props) {
  const t = useTranslations("staff");
  const alert = session.status === "idle";

  const name =
    session.displayName ??
    t("newPatient", { code: sessionCode(session.sessionId) });

  /** Each status is waiting on a different thing, so each says what it is waiting on. */
  const activity = (): string => {
    const since = formatElapsed(now - session.lastActiveAt);

    switch (session.status) {
      case "new":
        return t("activity.waiting", {
          elapsed: formatElapsed(now - session.startedAt),
        });
      case "typing":
        return now - session.lastActiveAt < 5000
          ? t("activity.activeNow")
          : t("activity.paused", { elapsed: since });
      case "idle":
        return t("activity.stuck", { elapsed: since });
      case "disconnected":
        return t("activity.lostConnection", { elapsed: since });
      case "submitted":
        return t("activity.submitted", { elapsed: since });
    }
  };

  const spelled = elapsedParts(now - session.lastActiveAt);

  return (
    <li>
      <Link
        href={`/staff/${session.sessionId}`}
        aria-current={selected ? "true" : undefined}
        className={[
          "grid grid-cols-[4px_1fr_auto] items-center gap-x-3 border-b border-line-soft",
          "min-h-14 hover:bg-surface-sub",
          alert ? "bg-status-idle-wash" : "",
          selected ? "bg-accent/10 hover:bg-accent/10" : "",
        ].join(" ")}
      >
        {/* A full-height rail: the status is readable from the edge of the row
            even when the chip is scrolled out of a narrow column. */}
        <span className={`h-full ${RAIL[session.status]}`} aria-hidden />

        <span className="flex min-w-0 flex-col gap-0.5 py-2.5">
          <span className="truncate text-base font-medium text-ink">{name}</span>
          <span className="tabular flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs text-ink-muted">
            <span>
              {t("progress", {
                filled: session.filledCount,
                total: session.totalFields,
              })}
            </span>
            <span title={t(`elapsed.${spelled.unit}`, { count: spelled.count })}>
              {activity()}
            </span>
            {session.invalidCount > 0 && (
              <span className="font-medium text-danger">
                {t("needFixing", { count: session.invalidCount })}
              </span>
            )}
          </span>
        </span>

        <span className="py-2.5 pr-3">
          <StatusChip status={session.status} />
        </span>
      </Link>
    </li>
  );
}
