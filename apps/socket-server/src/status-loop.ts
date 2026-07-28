import { STATUS_TICK_MS } from "@patient-forms/shared";
import { deriveStatus, isExpired } from "./domain";
import type { LobbyBroadcaster } from "./lobby";
import type { SessionStore } from "./store";

/**
 * One interval for the whole server, not one per session.
 *
 * Each tick re-derives every status, drops expired sessions, and releases the
 * lobby updates the throttle has been holding back.
 */
export function startStatusLoop(
  store: SessionStore,
  lobby: LobbyBroadcaster,
): NodeJS.Timeout {
  let running = false;

  const tick = async (): Promise<void> => {
    const now = Date.now();

    for (const record of await store.list()) {
      if (isExpired(record, now)) {
        await store.delete(record.sessionId);
        lobby.remove(record.sessionId);
        continue;
      }

      const status = deriveStatus(record, now);
      if (status === record.status) continue;

      record.status = status;
      await store.save(record);
      lobby.markChanged(record.sessionId);
    }

    await lobby.flush(now);
  };

  const interval = setInterval(() => {
    // A tick that overruns must not stack on the next one; with a network-backed
    // store that is how you end up with two passes deleting the same session.
    if (running) return;
    running = true;
    void tick()
      // A throwing tick must not kill the loop — the next one may well succeed,
      // and a server that silently stops deriving status looks fine from outside.
      .catch((error: unknown) => console.error("status tick failed:", error))
      .finally(() => {
        running = false;
      });
  }, STATUS_TICK_MS);

  // Nothing should be kept alive by this timer alone.
  interval.unref();
  return interval;
}
