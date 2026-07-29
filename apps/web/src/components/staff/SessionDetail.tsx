"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  FieldPatch,
  FieldState,
  FocusEvent,
  PatientFormField,
  SessionSnapshot,
} from "@patient-forms/shared";
import { displayValue } from "@/lib/display-value";
import { FIELD_CONFIGS, fieldConfig } from "@/lib/field-config";
import { fieldStateKind } from "@/lib/field-state";
import { formatElapsed } from "@/lib/relative-time";
import { useNow } from "@/lib/use-now";
import { useStaff } from "./StaffSocketProvider";
import { FieldStateMark } from "./FieldStateMark";
import { STATUS_LABEL, StatusChip } from "./StatusChip";

type Fields = Partial<Record<PatientFormField, FieldState>>;

export function SessionDetail({ sessionId }: { sessionId: string }) {
  const { socketRef, sessions, connection } = useStaff();
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [fields, setFields] = useState<Fields>({});
  const [focusedField, setFocusedField] = useState<PatientFormField | null>(null);
  const now = useNow();

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

  // The lobby summary is throttled to 1.5s, so trust the patch stream for the
  // clock — it is the difference between "stuck 4m" and "stuck 4m, probably".
  const lastActiveAt = Math.max(
    summary?.lastActiveAt ?? 0,
    ...Object.values(fields).map((state) => state.updatedAt),
  );

  const focusedLabel = focusedField ? fieldConfig(focusedField).label : null;

  if (!summary && snapshot === null && connection === "online") {
    return (
      <div className="flex h-full items-center justify-center px-6 py-16">
        <div className="max-w-sm text-center">
          <h2 className="text-base font-medium text-ink">This session has ended</h2>
          <p className="mt-1.5 text-sm text-ink-muted">
            It was submitted a while ago or the patient left without finishing.
          </p>
          <Link
            href="/staff"
            className="mt-4 inline-block rounded-field border border-line px-3 py-2 text-sm text-accent"
          >
            Back to the list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="flex h-full flex-col">
      <header className="border-b border-line bg-surface-sub px-4 py-3">
        <div className="flex items-start gap-2">
          <Link
            href="/staff"
            className="-ml-2 flex min-h-11 items-center rounded-field px-2 text-sm font-medium text-accent lg:hidden"
          >
            ← List
          </Link>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-ink">
              {summary?.displayName ?? "Loading…"}
            </h2>
            {summary && (
              <p className="tabular mt-0.5 flex flex-wrap gap-x-2.5 text-xs text-ink-muted">
                <span>
                  {summary.filledCount} of {summary.totalFields} fields
                </span>
                <span>last activity {formatElapsed(now - lastActiveAt)} ago</span>
                {summary.invalidCount > 0 && (
                  <span className="font-medium text-danger">
                    {summary.invalidCount} need
                    {summary.invalidCount === 1 ? "s" : ""} fixing
                  </span>
                )}
              </p>
            )}
          </div>

          {summary && <StatusChip status={summary.status} />}
        </div>

        {/* The whole reason for the screen: where the patient actually is. */}
        <p className="mt-2 text-xs">
          {focusedLabel ? (
            <span className="text-ink">
              Currently on{" "}
              <span className="font-semibold text-accent">{focusedLabel}</span>
            </span>
          ) : (
            <span className="text-ink-muted">Not on any field right now</span>
          )}
        </p>

        <p aria-live="polite" className="sr-only">
          {summary
            ? `${summary.displayName}, ${STATUS_LABEL[summary.status]}.${
                focusedLabel ? ` On the ${focusedLabel} field.` : ""
              }`
            : ""}
        </p>
      </header>

      <dl className="flex-1 overflow-y-auto">
        {FIELD_CONFIGS.map((config) => {
          const state = fields[config.field];
          const kind = fieldStateKind(state);
          const focused = focusedField === config.field;
          const shown = state ? displayValue(config, state.value) : "";

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
                {config.label}
                {focused && (
                  <span className="ml-1.5 font-semibold text-accent">
                    · here now
                  </span>
                )}
              </dt>

              <dd className="col-start-2 text-base wrap-break-word text-ink sm:col-start-3">
                {shown === "" ? (
                  <span className="text-ink-muted">Empty</span>
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
