import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@patient-forms/shared";

/** Nothing is broadcast between server nodes — there is only ever one. */
export type InterServerEvents = Record<string, never>;

export type SocketData = {
  /** Set on `session:init`. Present on patient sockets, absent on staff ones. */
  sessionId?: string;
};

export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
