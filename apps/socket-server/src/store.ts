import type {
  FieldState,
  PatientFormField,
  SessionStatus,
} from "@patient-forms/shared";

/** Everything the server knows about one patient's session. */
export type SessionRecord = {
  sessionId: string;
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
  save(record: SessionRecord): Promise<void>;
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

  async delete(sessionId: string): Promise<void> {
    this.#records.delete(sessionId);
  }
}
