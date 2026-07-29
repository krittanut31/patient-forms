"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { SessionSummary } from "@patient-forms/shared";
import { createSocket } from "@/lib/socket";
import type { AppSocket } from "@/lib/socket";

export type StaffConnection = "connecting" | "online" | "offline";

type StaffContextValue = {
  socketRef: React.RefObject<AppSocket | null>;
  connection: StaffConnection;
  sessions: SessionSummary[];
};

const StaffContext = createContext<StaffContextValue | null>(null);

export function useStaff(): StaffContextValue {
  const value = useContext(StaffContext);
  if (!value) throw new Error("useStaff must be used inside StaffSocketProvider");
  return value;
}

/**
 * One socket for the whole staff tab, owned by the layout.
 *
 * If this lived in the page instead, every click from the list to a patient
 * would tear the connection down and build a new one — losing the lobby feed
 * and re-fetching every snapshot on each navigation.
 */
export function StaffSocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<AppSocket | null>(null);
  const [connection, setConnection] = useState<StaffConnection>("connecting");
  const [byId, setById] = useState<Map<string, SessionSummary>>(new Map());

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    // Re-joined on every connect, not only the first. A reconnect that did not
    // re-join would leave the list frozen on whatever it last received.
    socket.on("connect", () => {
      setConnection("online");
      socket.emit("lobby:join");
    });
    socket.on("disconnect", () => setConnection("offline"));
    socket.io.on("reconnect_attempt", () => setConnection("connecting"));

    socket.on("lobby:snapshot", (summaries) => {
      // Replaces rather than merges: the snapshot is the authority, and a merge
      // would keep rows the server has already cleaned up.
      setById(new Map(summaries.map((s) => [s.sessionId, s])));
    });

    socket.on("lobby:update", (summary) => {
      setById((current) => {
        const next = new Map(current);
        next.set(summary.sessionId, summary);
        return next;
      });
    });

    socket.on("lobby:remove", ({ sessionId }) => {
      setById((current) => {
        if (!current.has(sessionId)) return current;
        const next = new Map(current);
        next.delete(sessionId);
        return next;
      });
    });

    return () => {
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const sessions = useMemo(() => [...byId.values()], [byId]);
  const value = useMemo(
    () => ({ socketRef, connection, sessions }),
    [connection, sessions],
  );

  return <StaffContext value={value}>{children}</StaffContext>;
}
