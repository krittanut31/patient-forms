import { MAX_TICKET } from "@patient-forms/shared";
import type {
  FieldState,
  PatientFormField,
  SessionStatus,
} from "@patient-forms/shared";

/** Everything the server knows about one patient's session. */
export type SessionRecord = {
  sessionId: string;
  /** Issued once by `nextTicket()` and never rewritten. */
  ticket: number;
  fields: Partial<Record<PatientFormField, FieldState>>;
  focusedField: PatientFormField | null;
  startedAt: number;
  lastActiveAt: number;
  submittedAt: number | null;
  connected: boolean;
  /** The socket currently owning this session, so a stale disconnect cannot
   *  clobber a reconnect that already landed. */
  socketId: string | null;
  /** Last status broadcast to staff. Only used to detect transitions. */
  status: SessionStatus;
};

/**
 * The persistence seam. Every method is async even though the only
 * implementation today is a Map — a Redis-backed store would be, and an
 * interface that is sync now would have to be rewritten at every call site to
 * swap it in later.
 */
export interface SessionStore {
  get(sessionId: string): Promise<SessionRecord | undefined>;
  list(): Promise<SessionRecord[]>;
  /**
   * The next ticket number to hand a patient.
   *
   * Lives behind this interface rather than in a module-level counter because it
   * is durable state, same as the sessions: two server processes sharing a Redis
   * would both have to draw from one sequence, or two patients in the same
   * waiting room would be told they are both #0007. Redis answers this with
   * `INCR`, which is why the signature returns the number rather than taking a
   * record to stamp.
   */
  nextTicket(): Promise<number>;
  /** Creates or replaces outright. Only used when a session first appears. */
  save(record: SessionRecord): Promise<void>;
  /**
   * Read-modify-write as one indivisible step.
   *
   * Doing this as `get`, mutate, `save` loses updates: two patches arriving in
   * the same tick both read the state from before either of them, and whichever
   * saves last wipes out the other. A patient typing quickly really does hit
   * this — it is not a theoretical race.
   *
   * `mutate` must be synchronous. Returning `false` abandons the write. A Redis
   * implementation would put this behind WATCH/MULTI or a Lua script.
   */
  update(
    sessionId: string,
    mutate: (record: SessionRecord) => boolean | void,
  ): Promise<SessionRecord | undefined>;
  delete(sessionId: string): Promise<void>;
}

/**
 * Reads and writes clones rather than live references. Handing out the stored
 * object would let a caller mutate it without calling `save()` and still see
 * the change — code that works here and silently breaks the day this is a
 * network-backed store.
 */
export class InMemorySessionStore implements SessionStore {
  readonly #records = new Map<string, SessionRecord>();

  /**
   * Counts up, never reuses, and wraps at `MAX_TICKET`.
   *
   * It restarts from 1 when the process does, which is the same trade the rest
   * of this store makes — a restart loses the sessions too, so there is nobody
   * left holding the old number except the patient looking at their own phone.
   * They will be re-issued one on reconnect. A Redis `INCR` is what makes the
   * sequence outlive a deploy.
   */
  #lastTicket = 0;

  async nextTicket(): Promise<number> {
    this.#lastTicket = (this.#lastTicket % MAX_TICKET) + 1;
    return this.#lastTicket;
  }

  async get(sessionId: string): Promise<SessionRecord | undefined> {
    const record = this.#records.get(sessionId);
    return record ? structuredClone(record) : undefined;
  }

  async list(): Promise<SessionRecord[]> {
    return [...this.#records.values()].map((record) => structuredClone(record));
  }

  async save(record: SessionRecord): Promise<void> {
    this.#records.set(record.sessionId, structuredClone(record));
  }

  async update(
    sessionId: string,
    mutate: (record: SessionRecord) => boolean | void,
  ): Promise<SessionRecord | undefined> {
    const current = this.#records.get(sessionId);
    if (!current) return undefined;

    // No await between the read and the write, so nothing can interleave.
    const draft = structuredClone(current);
    if (mutate(draft) === false) return undefined;
    this.#records.set(sessionId, draft);
    return structuredClone(draft);
  }

  async delete(sessionId: string): Promise<void> {
    this.#records.delete(sessionId);
  }
}
