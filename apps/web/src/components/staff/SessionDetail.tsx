"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { sessionCode } from "@patient-forms/shared";
import type {
  FieldPatch,
  FieldState,
  FocusEvent,
  PatientFormField,
  SessionSnapshot,
} from "@patient-forms/shared";
import { displayValue } from "@/lib/display-value";
import { FIELD_CONFIGS, fieldConfig } from "@/lib/field-config";
import { optionsFor } from "@/lib/field-options";
import { fieldStateKind } from "@/lib/field-state";
import { formatElapsed } from "@/lib/relative-time";
import { useNow } from "@/lib/use-now";
import { useStaff } from "./StaffSocketProvider";
import { FieldStateMark } from "./FieldStateMark";
import { StatusChip } from "./StatusChip";

type Fields = Partial<Record<PatientFormField, FieldState>>;

export function SessionDetail({ sessionId }: { sessionId: string }) {
  const { socketRef, sessions, connection } = useStaff();
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [fields, setFields] = useState<Fields>({});
  const [focusedField, setFocusedField] = useState<PatientFormField | null>(null);
  const now = useNow();

  const locale = useLocale();
  const t = useTranslations("staff");
  const tDetail = useTranslations("staff.detail");
  const tFields = useTranslations("fields");
  const tOptions = useTranslations("options");
  const tStatus = useTranslations("staff.status");

  // When this view opened. Used to suppress the change flash on arrival —
  // otherwise opening a half-filled form lights up eleven rows at once and the
  // highlight stops meaning "this just changed".
  const [openedAt] = useState(() => Date.now());

  const summary =
    sessions.find((s) => s.sessionId === sessionId) ?? snapshot?.summary ?? null;

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const join = (): void => {
      socket.emit("session:join", { sessionId });
    };

    const onSnapshot = (payload: SessionSnapshot): void => {
      if (payload.sessionId !== sessionId) return;
      setSnapshot(payload);
      setFields(payload.fields);
      setFocusedField(payload.focusedField);
    };

    const onPatch = (patch: FieldPatch): void => {
      if (patch.sessionId !== sessionId) return;
      setFields((current) => ({
        ...current,
        [patch.field]: {
          value: patch.value,
          isValid: patch.isValid,
          updatedAt: patch.at,
        },
      }));
    };

    const onFocus = (event: FocusEvent): void => {
      if (event.sessionId !== sessionId) return;
      setFocusedField(event.field);
    };

    socket.on("session:snapshot", onSnapshot);
    socket.on("session:patch", onPatch);
    socket.on("session:focus", onFocus);
    // Re-joining on reconnect matters as much here as for the lobby: the
    // snapshot that comes back is what repairs anything missed while down.
    socket.on("connect", join);
    if (socket.connected) join();

    return () => {
      // Without this leave, a staff member who browses ten patients ends up
      // subscribed to ten firehoses at once.
      socket.emit("session:leave", { sessionId });
      socket.off("session:snapshot", onSnapshot);
      socket.off("session:patch", onPatch);
      socket.off("session:focus", onFocus);
      socket.off("connect", join);
    };
  }, [sessionId, socketRef]);

  // Resolved once per language rather than per field per render: the
  // nationality list alone is 242 entries with a collator sort behind it.
  const optionsByField = useMemo(() => {
    const map = new Map<PatientFormField, ReturnType<typeof optionsFor>>();
    for (const config of FIELD_CONFIGS) {
      map.set(config.field, optionsFor(config, locale, tOptions));
    }
    return map;
  }, [locale, tOptions]);

  // The lobby summary is throttled to 1.5s, so trust the patch stream for the
  // clock — it is the difference between "stuck 4m" and "stuck 4m, probably".
  const lastActiveAt = Math.max(
    summary?.lastActiveAt ?? 0,
    ...Object.values(fields).map((state) => state.updatedAt),
  );

  const focusedLabel = focusedField
    ? tFields(`${fieldConfig(focusedField).field}.label`)
    : null;

  const name =
    summary?.displayName ?? t("newPatient", { code: sessionCode(sessionId) });

  if (!summary && snapshot === null && connection === "online") {
    return (
      <div className="flex h-full items-center justify-center px-6 py-16">
        <div className="max-w-sm text-center">
          <h2 className="text-base font-medium text-ink">
            {tDetail("endedHeading")}
          </h2>
          <p className="mt-1.5 text-sm text-ink-muted">{tDetail("endedBody")}</p>
          <Button
            component={Link}
            href="/staff"
            variant="default"
            size="sm"
            className="mt-4"
          >
            {tDetail("backLong")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <article className="flex h-full flex-col">
      {/* The status chip lives at the top right of this header, which is where
          the pinned language switcher lands at every width — the detail fills
          the screen on mobile and the right pane on desktop. */}
      <header className="border-b border-line bg-surface-sub py-3 pl-4 pr-28">
        <div className="flex items-start gap-2">
          <Button
            component={Link}
            href="/staff"
            variant="subtle"
            size="sm"
            className="-ml-2 lg:hidden"
          >
            {tDetail("back")}
          </Button>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-ink">
              {summary ? name : tDetail("loading")}
            </h2>
            {summary && (
              <p className="tabular mt-0.5 flex flex-wrap gap-x-2.5 text-xs text-ink-muted">
                <span>
                  {t("progress", {
                    filled: summary.filledCount,
                    total: summary.totalFields,
                  })}
                </span>
                <span>
                  {tDetail("lastActivity", {
                    elapsed: formatElapsed(now - lastActiveAt),
                  })}
                </span>
                {summary.invalidCount > 0 && (
                  <span className="font-medium text-danger">
                    {t("needFixing", { count: summary.invalidCount })}
                  </span>
                )}
              </p>
            )}
          </div>

          {summary && (
            <span className="shrink-0">
              <StatusChip status={summary.status} />
            </span>
          )}
        </div>

        {/* The whole reason for the screen: where the patient actually is. */}
        <p className="mt-2 text-xs">
          {focusedLabel ? (
            <span className="text-ink">
              {tDetail("focusedOn")}{" "}
              <span className="font-semibold text-accent">{focusedLabel}</span>
            </span>
          ) : (
            <span className="text-ink-muted">{tDetail("notFocused")}</span>
          )}
        </p>

        <p aria-live="polite" className="sr-only">
          {summary
            ? tDetail("announcement", {
                name,
                status: tStatus(summary.status),
                focus: focusedLabel
                  ? tDetail("announcementFocus", { field: focusedLabel })
                  : "",
              })
            : ""}
        </p>
      </header>

      <dl className="flex-1 overflow-y-auto">
        {FIELD_CONFIGS.map((config) => {
          const state = fields[config.field];
          const kind = fieldStateKind(state);
          const focused = focusedField === config.field;
          const shown = state
            ? displayValue(
                config,
                state.value,
                locale,
                optionsByField.get(config.field) ?? [],
              )
            : "";

          return (
            <div
              key={config.field}
              className={[
                "grid grid-cols-[1.25rem_1fr] items-baseline gap-x-2.5 gap-y-0.5",
                "border-b border-line-soft px-4 py-2.5",
                "sm:grid-cols-[1.25rem_11rem_1fr] sm:gap-x-3",
                focused ? "bg-accent/10" : "",
              ].join(" ")}
            >
              <FieldStateMark state={kind} />

              <dt className="col-start-2 text-xs text-ink-muted">
                {tFields(`${config.field}.label`)}
                {focused && (
                  <span className="ml-1.5 font-semibold text-accent">
                    {tDetail("hereNow")}
                  </span>
                )}
              </dt>

              <dd className="col-start-2 text-base wrap-break-word text-ink sm:col-start-3">
                {shown === "" ? (
                  <span className="text-ink-muted">{tDetail("empty")}</span>
                ) : (
                  <span
                    // Remounting on a new timestamp replays the CSS animation —
                    // no timers to clear, and it cannot get stuck mid-flash.
                    key={state?.updatedAt}
                    className={[
                      "-mx-1 inline-block rounded-chip px-1",
                      kind === "invalid" ? "font-medium text-danger" : "",
                      state && state.updatedAt > openedAt ? "field-flash" : "",
                    ].join(" ")}
                  >
                    {shown}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}
