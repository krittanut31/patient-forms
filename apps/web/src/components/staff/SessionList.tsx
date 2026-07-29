"use client";

import { useMemo, useState } from "react";
import { SUBMITTED_RETENTION_MS } from "@patient-forms/shared";
import {
  countAttention,
  SORT_OPTIONS,
  sortSessions,
  splitBySubmitted,
} from "@/lib/session-sort";
import type { SortKey } from "@/lib/session-sort";
import { useNow } from "@/lib/use-now";
import { useStaff } from "./StaffSocketProvider";
import { SessionRow } from "./SessionRow";

const RETENTION_MINUTES = Math.round(SUBMITTED_RETENTION_MS / 60_000);

export function SessionList({ selectedId }: { selectedId: string | null }) {
  const { sessions, connection } = useStaff();
  const [sort, setSort] = useState<SortKey>("needs-help");
  const now = useNow();

  const { active, submitted } = useMemo(() => {
    const ordered = sortSessions(sessions, sort);
    return splitBySubmitted(ordered);
  }, [sessions, sort]);

  const counts = countAttention(sessions);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-line bg-surface-sub px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-base font-semibold text-ink">Filling in now</h1>
          <p className="tabular text-xs text-ink-muted">
            <span className="font-semibold text-ink">{counts.filling}</span>{" "}
            filling in ·{" "}
            <span
              className={
                counts.stuck > 0
                  ? "font-semibold text-status-idle"
                  : "font-semibold text-ink"
              }
            >
              {counts.stuck}
            </span>{" "}
            need help
          </p>
        </div>

        {/* Announced rather than only coloured, so the count reaches someone
            who is not looking at this panel. */}
        <p aria-live="polite" className="sr-only">
          {counts.stuck === 0
            ? "No patients need help."
            : `${counts.stuck} patient${counts.stuck === 1 ? "" : "s"} need help.`}
        </p>

        <div className="mt-2.5 flex items-center gap-2">
          <label htmlFor="sort" className="text-xs text-ink-muted">
            Sort by
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="min-h-8 rounded-field border border-line bg-surface px-2 text-xs text-ink"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {connection !== "online" && (
          <p className="border-b border-status-idle bg-status-idle-wash px-4 py-2.5 text-xs text-ink">
            {connection === "connecting"
              ? "Reconnecting. This list may be out of date."
              : "Disconnected. This list is frozen and not updating."}
          </p>
        )}

        {active.length === 0 && submitted.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-base font-medium text-ink">Nobody is filling in a form</p>
            <p className="mt-1.5 text-sm text-ink-muted">
              Sessions appear here the moment a patient opens the form. Hand out
              the counter tablet or point them at the QR code.
            </p>
          </div>
        ) : (
          <>
            <ul>
              {active.map((session) => (
                <SessionRow
                  key={session.sessionId}
                  session={session}
                  now={now}
                  selected={session.sessionId === selectedId}
                />
              ))}
            </ul>

            {submitted.length > 0 && (
              <>
                {/* Kept visible rather than disappearing on submit: staff often
                    need the person who just finished, not the ones still going. */}
                <h2 className="border-y border-line-soft bg-surface-sub px-4 py-1.5 font-mono text-2xs tracking-[0.1em] text-ink-muted uppercase">
                  Submitted · kept for {RETENTION_MINUTES} minutes
                </h2>
                <ul>
                  {submitted.map((session) => (
                    <SessionRow
                      key={session.sessionId}
                      session={session}
                      now={now}
                      selected={session.sessionId === selectedId}
                    />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
