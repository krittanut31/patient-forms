import type { PatientFormField } from "./patient-form";
import type {
  FieldPatch,
  FieldPatchInput,
  SessionSnapshot,
  SessionSummary,
} from "./session";

/**
 * Result of `session:init`, returned via ack.
 *
 * The server echoes back the session id it actually used — it may differ from
 * the one the client offered if that session was already reaped — plus the
 * fields already on record, so a patient who refreshes gets their form back
 * instead of a blank one.
 */
export type SessionInitResult = {
  sessionId: string;
  /**
   * The number to show the patient. Comes back on every init, not just the
   * first: a refresh must show the same number the patient may already have
   * quoted to staff, and a session the server no longer has gets a new one.
   */
  ticket: number;
  fields: SessionSnapshot["fields"];
};

export type FocusEvent = {
  sessionId: string;
  /** `null` when the patient blurs without focusing another field. */
  field: PatientFormField | null;
  at: number;
};

export type ClientToServerEvents = {
  /** Patient. `sessionId` is the one held in sessionStorage, or null on a first visit. */
  "session:init": (
    payload: { sessionId: string | null },
    ack: (result: SessionInitResult) => void,
  ) => void;
  /** Patient. Debounced 300ms for free text, immediate for selects and dates. */
  "session:patch": (payload: FieldPatchInput) => void;
  /** Patient. Focus moved, or blurred to nothing. */
  "session:focus": (payload: { field: PatientFormField | null }) => void;
  /** Patient. Form submitted. */
  "session:submit": () => void;

  /** Staff. Subscribe to the throttled lobby feed. */
  "lobby:join": () => void;
  /** Staff. Subscribe to full patches for one session. */
  "session:join": (payload: { sessionId: string }) => void;
  /** Staff. Must be emitted on unmount, or the client ends up on ten firehoses. */
  "session:leave": (payload: { sessionId: string }) => void;
};

export type ServerToClientEvents = {
  /** Full list on join, and again after a reconnect. */
  "lobby:snapshot": (payload: SessionSummary[]) => void;
  /** One session changed. Throttled to `LOBBY_THROTTLE_MS`. */
  "lobby:update": (payload: SessionSummary) => void;
  /** Session was cleaned up server-side and should leave the list. */
  "lobby:remove": (payload: { sessionId: string }) => void;

  /** Everything known about one session, sent on `session:join`. */
  "session:snapshot": (payload: SessionSnapshot) => void;
  /** One field changed, for the session this client has open. */
  "session:patch": (payload: FieldPatch) => void;
  /** Which field the patient is on — the "go help them" signal. */
  "session:focus": (payload: FocusEvent) => void;
};

/** Room names. Kept here so the server never builds a room string by hand. */
export const LOBBY_ROOM = "lobby";
export const sessionRoom = (sessionId: string) => `session:${sessionId}`;
