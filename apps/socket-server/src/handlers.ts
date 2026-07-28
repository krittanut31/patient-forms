import { randomUUID } from "node:crypto";
import { FIELD_ORDER, LOBBY_ROOM, sessionRoom } from "@patient-forms/shared";
import type { FieldPatch, PatientFormField } from "@patient-forms/shared";
import { createSession, toSnapshot, toSummary } from "./domain";
import type { LobbyBroadcaster } from "./lobby";
import type { SessionRecord, SessionStore } from "./store";
import type { AppServer, AppSocket } from "./types";

const isKnownField = (field: unknown): field is PatientFormField =>
  FIELD_ORDER.includes(field as PatientFormField);

export function registerHandlers(
  io: AppServer,
  store: SessionStore,
  lobby: LobbyBroadcaster,
): void {
  io.on("connection", (socket: AppSocket) => {
    /**
     * Loads the session this socket owns, or nothing if it has not identified
     * itself or the session has already been submitted. Submitted sessions stop
     * accepting input so a late debounced patch cannot reopen a finished form.
     */
    const activeSession = async (): Promise<SessionRecord | undefined> => {
      const sessionId = socket.data.sessionId;
      if (!sessionId) return undefined;
      const record = await store.get(sessionId);
      if (!record || record.submittedAt !== null) return undefined;
      return record;
    };

    // ---- patient -----------------------------------------------------------

    socket.on("session:init", async ({ sessionId }, ack) => {
      const now = Date.now();
      const existing = sessionId ? await store.get(sessionId) : undefined;

      if (existing) {
        // A refresh or a reconnect. Same row in the staff list, not a new one.
        existing.connected = true;
        existing.socketId = socket.id;
        await store.save(existing);
        socket.data.sessionId = existing.sessionId;
        lobby.markChanged(existing.sessionId);
        ack({ sessionId: existing.sessionId, fields: existing.fields });
        return;
      }

      // Any id offered for a session we do not have is discarded rather than
      // trusted — the server names sessions, clients only echo the name back.
      const record = createSession(randomUUID(), socket.id, now);
      await store.save(record);
      socket.data.sessionId = record.sessionId;
      lobby.markChanged(record.sessionId);
      ack({ sessionId: record.sessionId, fields: record.fields });
    });

    socket.on("session:patch", async ({ field, value, isValid }) => {
      if (!isKnownField(field) || typeof value !== "string") return;
      const record = await activeSession();
      if (!record) return;

      const now = Date.now();
      record.fields[field] = { value, isValid, updatedAt: now };
      record.lastActiveAt = now;
      await store.save(record);

      const patch: FieldPatch = {
        sessionId: record.sessionId,
        field,
        value,
        isValid,
        at: now,
      };
      io.to(sessionRoom(record.sessionId)).emit("session:patch", patch);
      lobby.markChanged(record.sessionId);
    });

    socket.on("session:focus", async ({ field }) => {
      if (field !== null && !isKnownField(field)) return;
      const record = await activeSession();
      if (!record) return;

      const now = Date.now();
      record.focusedField = field;
      // Deliberately does not touch lastActiveAt. Someone sitting on the address
      // field for four minutes is exactly who staff need surfaced as idle, and
      // counting focus as activity would hide them.
      await store.save(record);

      io.to(sessionRoom(record.sessionId)).emit("session:focus", {
        sessionId: record.sessionId,
        field,
        at: now,
      });
    });

    socket.on("session:submit", async () => {
      const record = await activeSession();
      if (!record) return;

      const now = Date.now();
      record.submittedAt = now;
      record.lastActiveAt = now;
      record.focusedField = null;
      await store.save(record);

      io.to(sessionRoom(record.sessionId)).emit("session:focus", {
        sessionId: record.sessionId,
        field: null,
        at: now,
      });
      lobby.markChanged(record.sessionId);
    });

    // ---- staff -------------------------------------------------------------

    socket.on("lobby:join", async () => {
      socket.join(LOBBY_ROOM);
      const now = Date.now();
      const records = await store.list();
      // Sent on every join, including re-joins after a reconnect, so a client
      // that missed updates while offline is made whole rather than patched.
      socket.emit(
        "lobby:snapshot",
        records.map((record) => toSummary(record, now)),
      );
    });

    socket.on("session:join", async ({ sessionId }) => {
      socket.join(sessionRoom(sessionId));
      const record = await store.get(sessionId);
      if (!record) return;
      socket.emit("session:snapshot", toSnapshot(record, Date.now()));
    });

    socket.on("session:leave", ({ sessionId }) => {
      socket.leave(sessionRoom(sessionId));
    });

    // ---- teardown ----------------------------------------------------------

    socket.on("disconnect", async () => {
      const sessionId = socket.data.sessionId;
      if (!sessionId) return;
      const record = await store.get(sessionId);
      // A reconnect can land before the old socket's disconnect fires. Only the
      // socket still registered as the owner is allowed to mark it offline.
      if (!record || record.socketId !== socket.id) return;

      record.connected = false;
      record.socketId = null;
      record.focusedField = null;
      await store.save(record);
      lobby.markChanged(sessionId);
    });
  });
}
