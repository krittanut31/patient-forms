import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@patient-forms/shared";

/** Client-side generics are the mirror of the server's: it sends what the server listens for. */
export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

export function createSocket(): AppSocket {
  return io(SOCKET_URL, {
    // Deliberately left on the default transport list. Websocket-only fails
    // behind proxies that do not upgrade, and a hospital network is exactly
    // where that happens.
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
  });
}
