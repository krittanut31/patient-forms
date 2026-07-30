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
   * The patient's name once first and last have both arrived, `null` before
   * that.
   *
   * Deliberately not a ready-made "New patient #A3F2" string: the server has no
   * idea what language the staff member reading the list has chosen, so it
   * sends the fact and lets the client write the sentence. `sessionCode` gives
   * the client the same four characters to put in it.
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
 * Four characters standing in for a patient who has not typed a name yet.
 * Derived from the session id so it does not change as the row re-renders.
 */
export function sessionCode(sessionId: string): string {
  return sessionId
    .replace(/[^a-fA-F0-9]/g, "")
    .slice(-4)
    .toUpperCase()
    .padStart(4, "0");
}
