import { LOBBY_ROOM, LOBBY_THROTTLE_MS } from "@patient-forms/shared";
import { toSummary } from "./domain";
import type { SessionStore } from "./store";
import type { AppServer } from "./types";

/**
 * Rate-limits the lobby feed to one update per session per LOBBY_THROTTLE_MS.
 *
 * Thirty patients typing at once would otherwise push a re-render of the whole
 * staff list on every keystroke, for data the list does not even show.
 *
 * Marked sessions are released by the status tick rather than by a timer per
 * session — one timer for the whole server, as the brief requires.
 */
export class LobbyBroadcaster {
  readonly #io: AppServer;
  readonly #store: SessionStore;
  readonly #lastEmittedAt = new Map<string, number>();
  readonly #pending = new Set<string>();

  constructor(io: AppServer, store: SessionStore) {
    this.#io = io;
    this.#store = store;
  }

  /** Something about this session changed; emit when the throttle allows. */
  markChanged(sessionId: string): void {
    this.#pending.add(sessionId);
  }

  async flush(now: number): Promise<void> {
    for (const sessionId of [...this.#pending]) {
      const lastEmittedAt = this.#lastEmittedAt.get(sessionId) ?? 0;
      if (now - lastEmittedAt < LOBBY_THROTTLE_MS) continue;

      this.#pending.delete(sessionId);
      const record = await this.#store.get(sessionId);
      if (!record) continue;

      this.#lastEmittedAt.set(sessionId, now);
      this.#io.to(LOBBY_ROOM).emit("lobby:update", toSummary(record, now));
    }
  }

  /** Session is gone. Sent immediately — a stale row is worse than a chatty one. */
  remove(sessionId: string): void {
    this.#pending.delete(sessionId);
    this.#lastEmittedAt.delete(sessionId);
    this.#io.to(LOBBY_ROOM).emit("lobby:remove", { sessionId });
  }
}
