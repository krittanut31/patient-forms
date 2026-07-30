import type { PatientFormField } from "./patient-form";

/**
 * Derived on the server from event timestamps — never declared by the client.
 * A browser that dies mid-session cannot leave itself stuck as `typing`.
 */
export type SessionStatus =
  | "new"
  | "typing"
  | "idle"
  | "submitted"
  | "disconnected";

/**
 * A single field change, as broadcast to staff watching one session.
 *
 * Invalid values are carried too, flagged with `isValid: false` — staff need to
 * see that the patient typed a malformed phone number.
 */
export type FieldPatch = {
  sessionId: string;
  field: PatientFormField;
  value: string;
  isValid: boolean;
  at: number;
};

/**
 * What the patient sends. The server stamps `sessionId` and `at` itself so a
 * client cannot backdate activity and skew its own derived status.
 */
export type FieldPatchInput = Pick<FieldPatch, "field" | "value" | "isValid">;

/** The small object the lobby list renders. Throttled, and deliberately flat. */
export type SessionSummary = {
  sessionId: string;
  /**
   * The number the patient reads off their own screen and says out loud.
   *
   * Issued once when the session is created and never changed, so it is safe
   * for a patient to write down or repeat to staff. Note that it is not the row
   * position in the staff list — that reorders every time somebody's status
   * changes, which would point a nurse at the wrong chair.
   */
  ticket: number;
  /**
   * The patient's name once first and last have both arrived, `null` before
   * that.
   *
   * Deliberately not a ready-made "New patient" string: the server has no idea
   * what language the staff member reading the list has chosen, so it sends the
   * fact and lets the client write the sentence.
   */
  displayName: string | null;
  status: SessionStatus;
  filledCount: number;
  totalFields: number;
  invalidCount: number;
  startedAt: number;
  lastActiveAt: number;
};

export type FieldState = {
  value: string;
  isValid: boolean;
  updatedAt: number;
};

/**
 * Everything the detail view needs on join, so a staff member who opens a
 * session late sees what has already been entered rather than a half-empty form.
 */
export type SessionSnapshot = {
  sessionId: string;
  summary: SessionSummary;
  fields: Partial<Record<PatientFormField, FieldState>>;
  focusedField: PatientFormField | null;
};

/**
 * Ticket numbers wrap here rather than growing a fifth digit.
 *
 * Safe because an abandoned session is reaped after 5 minutes and a submitted
 * one after 10, so reaching the same number twice would take ten thousand
 * patients inside ten minutes. Keeping the printed form four digits forever is
 * worth more than counting past it.
 */
export const MAX_TICKET = 9999;

/**
 * How a ticket is written wherever a person reads it — on the patient's own
 * screen and in the staff list. One function, both apps, so the two can never
 * show the same patient a differently formatted number.
 */
export function formatTicket(ticket: number): string {
  return `#${String(ticket).padStart(4, "0")}`;
}
