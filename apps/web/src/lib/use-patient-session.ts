"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PATCH_DEBOUNCE_MS } from "@patient-forms/shared";
import type {
  FieldState,
  PatientForm,
  PatientFormField,
} from "@patient-forms/shared";
import { createSocket } from "./socket";
import type { AppSocket } from "./socket";
import { isFieldValid } from "./intake-schema";

const SESSION_KEY = "patient-forms:session-id";

export type ConnectionState = "connecting" | "online" | "offline";

type Pending = { timer: ReturnType<typeof setTimeout>; send: () => void };

export type PatientSession = {
  connection: ConnectionState;
  sessionId: string | null;
  /**
   * Fields the server already held, handed over once. A refresh keeps the
   * session id but loses the form, so without this the patient comes back to an
   * empty form while staff still see what they typed.
   */
  restored: Partial<Record<PatientFormField, FieldState>> | null;
  /**
   * Bumped every time the session re-identifies after a drop. The form watches
   * this and pushes its current values — anything typed while offline never
   * reached the server, and the form is the only place it exists.
   */
  resyncToken: number;
  patch: (field: PatientFormField, value: string, immediate: boolean) => void;
  focus: (field: PatientFormField | null) => void;
  sendAll: (values: PatientForm) => void;
  submit: () => void;
};

/**
 * Owns the socket. Deliberately knows nothing about the form: the form holds
 * the values and hands them over when this hook says a resync is needed.
 */
export function usePatientSession(): PatientSession {
  const socketRef = useRef<AppSocket | null>(null);
  const pendingRef = useRef(new Map<PatientFormField, Pending>());
  const initialisedRef = useRef(false);

  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [restored, setRestored] = useState<PatientSession["restored"]>(null);
  const [resyncToken, setResyncToken] = useState(0);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;
    const pending = pendingRef.current;

    const identify = (): void => {
      const stored = window.sessionStorage.getItem(SESSION_KEY);
      socket.emit("session:init", { sessionId: stored }, (result) => {
        window.sessionStorage.setItem(SESSION_KEY, result.sessionId);
        setSessionId(result.sessionId);

        if (initialisedRef.current) {
          setResyncToken((token) => token + 1);
          return;
        }
        initialisedRef.current = true;
        setRestored(result.fields);
      });
    };

    // Re-identifying on every connect, not just the first, is what makes a
    // dropped connection recoverable rather than a new row in the staff list.
    socket.on("connect", () => {
      setConnection("online");
      identify();
    });
    socket.on("disconnect", () => setConnection("offline"));
    socket.io.on("reconnect_attempt", () => setConnection("connecting"));

    return () => {
      for (const { timer } of pending.values()) clearTimeout(timer);
      pending.clear();
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const emitPatch = useCallback(
    (field: PatientFormField, value: string): void => {
      // Invalid values go out too, flagged — staff need to see the malformed
      // phone number, not a gap where it should be.
      socketRef.current?.emit("session:patch", {
        field,
        value,
        isValid: isFieldValid(field, value),
      });
    },
    [],
  );

  const patch = useCallback(
    (field: PatientFormField, value: string, immediate: boolean): void => {
      const pending = pendingRef.current;
      const existing = pending.get(field);
      if (existing) clearTimeout(existing.timer);

      if (immediate) {
        pending.delete(field);
        emitPatch(field, value);
        return;
      }

      const send = (): void => {
        pending.delete(field);
        emitPatch(field, value);
      };
      pending.set(field, { timer: setTimeout(send, PATCH_DEBOUNCE_MS), send });
    },
    [emitPatch],
  );

  const focus = useCallback((field: PatientFormField | null): void => {
    socketRef.current?.emit("session:focus", { field });
  }, []);

  const sendAll = useCallback(
    (values: PatientForm): void => {
      for (const [field, value] of Object.entries(values) as [
        PatientFormField,
        string,
      ][]) {
        // Empty values are skipped on purpose. Sending "" would create a field
        // entry on the server, turning "never touched" into "typed then
        // cleared" — two states the staff detail view shows differently.
        if (value === "") continue;
        emitPatch(field, value);
      }
    },
    [emitPatch],
  );

  const submit = useCallback((): void => {
    // Run the waiting debounces instead of dropping them, or the last few
    // characters typed before pressing submit never arrive.
    const pending = pendingRef.current;
    for (const { timer, send } of [...pending.values()]) {
      clearTimeout(timer);
      send();
    }
    pending.clear();

    socketRef.current?.emit("session:submit");
  }, []);

  return {
    connection,
    sessionId,
    restored,
    resyncToken,
    patch,
    focus,
    sendAll,
    submit,
  };
}
