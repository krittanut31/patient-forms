"use client";

import Link from "next/link";
import type { SessionSummary } from "@patient-forms/shared";
import { describeElapsed, formatElapsed } from "@/lib/relative-time";
import { RAIL, StatusChip } from "./StatusChip";

type Props = {
  session: SessionSummary;
  now: number;
  selected: boolean;
};

/** Each status is waiting on a different thing, so each says what it is waiting on. */
function activityLabel(session: SessionSummary, now: number): string {
  const since = formatElapsed(now - session.lastActiveAt);

  switch (session.status) {
    case "new":
      return `waiting ${formatElapsed(now - session.startedAt)}`;
    case "typing":
      return now - session.lastActiveAt < 5000 ? "active now" : `paused ${since}`;
    case "idle":
      return `stuck ${since}`;
    case "disconnected":
      return `lost connection ${since} ago`;
    case "submitted":
      return `submitted ${since} ago`;
  }
}

export function SessionRow({ session, now, selected }: Props) {
  const alert = session.status === "idle";

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
          <span className="truncate text-base font-medium text-ink">
            {session.displayName}
          </span>
          <span className="tabular flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs text-ink-muted">
            <span>
              {session.filledCount} of {session.totalFields} fields
            </span>
            <span title={describeElapsed(now - session.lastActiveAt)}>
              {activityLabel(session, now)}
            </span>
            {session.invalidCount > 0 && (
              <span className="font-medium text-danger">
                {session.invalidCount} need
                {session.invalidCount === 1 ? "s" : ""} fixing
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
