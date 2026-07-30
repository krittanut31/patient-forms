import { randomUUID } from "node:crypto";
import { FIELD_ORDER, LOBBY_ROOM, sessionRoom } from "@patient-forms/shared";
import type { FieldPatch, PatientFormField } from "@patient-forms/shared";
import { createSession, toSnapshot, toSummary } from "./domain";
import type { LobbyBroadcaster } from "./lobby";
import type { SessionStore } from "./store";
import type { AppServer, AppSocket } from "./types";

const isKnownField = (field: unknown): field is PatientFormField =>
  FIELD_ORDER.includes(field as PatientFormField);

export function registerHandlers(
  io: AppServer,
  store: SessionStore,
  lobby: LobbyBroadcaster,
): void {
  io.on("connection", (socket: AppSocket) => {
    // ---- patient -----------------------------------------------------------

    socket.on("session:init", async ({ sessionId }, ack) => {
      if (sessionId) {
        // A refresh or a reconnect. Same row in the staff list, not a new one.
        const rejoined = await store.update(sessionId, (record) => {
          record.connected = true;
          record.socketId = socket.id;
        });

        if (rejoined) {
          socket.data.sessionId = rejoined.sessionId;
          lobby.markChanged(rejoined.sessionId);
          // The ticket comes back unchanged. A patient who refreshed must not be
          // told a new number — they may already have quoted the old one.
          ack({
            sessionId: rejoined.sessionId,
            ticket: rejoined.ticket,
            fields: rejoined.fields,
          });
          return;
        }
      }

      // Any id offered for a session we do not have is discarded rather than
      // trusted — the server names sessions, clients only echo the name back.
      // The ticket is drawn here and nowhere else, so one session is one number.
      const ticket = await store.nextTicket();
      const record = createSession(randomUUID(), ticket, socket.id, Date.now());
      await store.save(record);
      socket.data.sessionId = record.sessionId;
      lobby.markChanged(record.sessionId);
      ack({
        sessionId: record.sessionId,
        ticket: record.ticket,
        fields: record.fields,
      });
    });

    socket.on("session:patch", async ({ field, value, isValid }) => {
      const sessionId = socket.data.sessionId;
      if (!sessionId) return;
      if (!isKnownField(field) || typeof value !== "string") return;

      const now = Date.now();
      const updated = await store.update(sessionId, (record) => {
        // A late debounced patch must not reopen a finished form.
        if (record.submittedAt !== null) return false;
        record.fields[field] = { value, isValid, updatedAt: now };
        record.lastActiveAt = now;
      });
      if (!updated) return;

      const patch: FieldPatch = { sessionId, field, value, isValid, at: now };
      io.to(sessionRoom(sessionId)).emit("session:patch", patch);
      lobby.markChanged(sessionId);
    });

    socket.on("session:focus", async ({ field }) => {
      const sessionId = socket.data.sessionId;
      if (!sessionId) return;
      if (field !== null && !isKnownField(field)) return;

      const updated = await store.update(sessionId, (record) => {
        if (record.submittedAt !== null) return false;
        // Deliberately does not touch lastActiveAt. Someone sitting on the
        // address field for four minutes is exactly who staff need surfaced as
        // idle, and counting focus as activity would hide them.
        record.focusedField = field;
      });
      if (!updated) return;

      io.to(sessionRoom(sessionId)).emit("session:focus", {
        sessionId,
        field,
        at: Date.now(),
      });
    });

    socket.on("session:submit", async () => {
      const sessionId = socket.data.sessionId;
      if (!sessionId) return;

      const now = Date.now();
      const updated = await store.update(sessionId, (record) => {
        if (record.submittedAt !== null) return false;
        record.submittedAt = now;
        record.lastActiveAt = now;
        record.focusedField = null;
      });
      if (!updated) return;

      io.to(sessionRoom(sessionId)).emit("session:focus", {
        sessionId,
        field: null,
        at: now,
      });
      lobby.markChanged(sessionId);
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

      const updated = await store.update(sessionId, (record) => {
        // A reconnect can land before the old socket's disconnect fires. Only
        // the socket still registered as the owner may mark it offline.
        if (record.socketId !== socket.id) return false;
        record.connected = false;
        record.socketId = null;
        record.focusedField = null;
      });
      if (updated) lobby.markChanged(sessionId);
    });
  });
}
