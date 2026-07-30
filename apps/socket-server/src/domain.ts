import {
  ABANDONED_CLEANUP_MS,
  IDLE_AFTER_MS,
  SUBMITTED_RETENTION_MS,
  TOTAL_FIELDS,
  TYPING_WINDOW_MS,
} from "@patient-forms/shared";
import type {
  SessionSnapshot,
  SessionStatus,
  SessionSummary,
} from "@patient-forms/shared";
import type { SessionRecord } from "./store";

export function createSession(
  sessionId: string,
  ticket: number,
  socketId: string,
  now: number,
): SessionRecord {
  return {
    sessionId,
    ticket,
    fields: {},
    focusedField: null,
    startedAt: now,
    lastActiveAt: now,
    submittedAt: null,
    connected: true,
    socketId,
    status: "new",
  };
}

/** Whether the patient has entered anything at all, valid or not. */
export function hasInput(record: SessionRecord): boolean {
  return Object.keys(record.fields).length > 0;
}

/**
 * The single source of truth for status. Derived from timestamps only, never
 * from anything the client claims about itself, so a browser that dies mid-form
 * cannot leave the row stuck reading `typing`.
 */
export function deriveStatus(record: SessionRecord, now: number): SessionStatus {
  if (record.submittedAt !== null) return "submitted";
  if (!record.connected) return "disconnected";
  if (!hasInput(record)) return "new";

  const silentFor = now - record.lastActiveAt;
  if (silentFor <= TYPING_WINDOW_MS) return "typing";
  if (silentFor > IDLE_AFTER_MS) return "idle";

  // Between the two windows the brief names no state. Held as `typing` rather
  // than promoted early, so `idle` keeps meaning "this person needs help"
  // instead of "this person paused to think".
  return "typing";
}

/** `null` until both halves of a name exist — the client writes the stand-in. */
export function displayNameFor(record: SessionRecord): string | null {
  const first = record.fields.firstName?.value.trim() ?? "";
  const last = record.fields.lastName?.value.trim() ?? "";
  return first && last ? `${first} ${last}` : null;
}

export function toSummary(record: SessionRecord, now: number): SessionSummary {
  const states = Object.values(record.fields);
  return {
    sessionId: record.sessionId,
    ticket: record.ticket,
    displayName: displayNameFor(record),
    status: deriveStatus(record, now),
    // A malformed phone number is still a field the patient has filled in, so
    // it counts towards progress and towards the invalid tally.
    filledCount: states.filter((state) => state.value.trim() !== "").length,
    invalidCount: states.filter((state) => !state.isValid).length,
    totalFields: TOTAL_FIELDS,
    startedAt: record.startedAt,
    lastActiveAt: record.lastActiveAt,
  };
}

export function toSnapshot(
  record: SessionRecord,
  now: number,
): SessionSnapshot {
  return {
    sessionId: record.sessionId,
    summary: toSummary(record, now),
    fields: record.fields,
    focusedField: record.focusedField,
  };
}

/** Cleanup rules, exactly as specified: 5 minutes empty, 10 minutes submitted. */
export function isExpired(record: SessionRecord, now: number): boolean {
  if (record.submittedAt !== null) {
    return now - record.submittedAt > SUBMITTED_RETENTION_MS;
  }
  if (!hasInput(record)) {
    return now - record.startedAt > ABANDONED_CLEANUP_MS;
  }
  return false;
}
