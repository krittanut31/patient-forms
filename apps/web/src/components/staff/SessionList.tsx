"use client";

import { useMemo, useState } from "react";
import { Alert, NativeSelect } from "@mantine/core";
import { useTranslations } from "next-intl";
import { SUBMITTED_RETENTION_MS } from "@patient-forms/shared";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  countAttention,
  SORT_KEYS,
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
  const t = useTranslations("staff");

  const { active, submitted } = useMemo(() => {
    const ordered = sortSessions(sessions, sort);
    return splitBySubmitted(ordered);
  }, [sessions, sort]);

  const counts = countAttention(sessions);

  const sortOptions = useMemo(
    () => SORT_KEYS.map((key) => ({ value: key, label: t(`sort.${key}`) })),
    [t],
  );

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-line bg-surface-sub px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-base font-semibold text-ink">
            {t("listHeading")}
          </h1>
          {/* The two numbers carry the weight, not the words around them, and
              "need help" turns amber only when there is somebody in it. */}
          <p className="tabular text-xs text-ink-muted">
            {t.rich("counts", {
              filling: () => (
                <span className="font-semibold text-ink">{counts.filling}</span>
              ),
              stuck: () => (
                <span
                  className={
                    counts.stuck > 0
                      ? "font-semibold text-status-idle"
                      : "font-semibold text-ink"
                  }
                >
                  {counts.stuck}
                </span>
              ),
            })}
          </p>
        </div>

        {/* Announced rather than only coloured, so the count reaches someone
            who is not looking at this panel. */}
        <p aria-live="polite" className="sr-only">
          {t("stuckAnnouncement", { count: counts.stuck })}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-2">
          <label htmlFor="sort" className="text-xs text-ink-muted">
            {t("sortBy")}
          </label>
          <NativeSelect
            id="sort"
            size="xs"
            value={sort}
            onChange={(event) => setSort(event.currentTarget.value as SortKey)}
            data={sortOptions}
            aria-label={t("sortLabel")}
            styles={{ input: { minHeight: "2.75rem" } }}
          />
          <span className="ml-auto">
            <LanguageSwitcher />
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {connection !== "online" && (
          <Alert
            variant="light"
            radius={0}
            classNames={{
              root: "border-b border-status-idle bg-status-idle-wash px-4 py-2.5",
              body: "text-xs text-ink",
            }}
          >
            {connection === "connecting"
              ? t("listReconnecting")
              : t("listOffline")}
          </Alert>
        )}

        {active.length === 0 && submitted.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-base font-medium text-ink">
              {t("emptyHeading")}
            </p>
            <p className="mt-1.5 text-sm text-ink-muted">{t("emptyBody")}</p>
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
                  {t("submittedGroup", { minutes: RETENTION_MINUTES })}
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
