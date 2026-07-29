import { createServer } from "node:http";
import { Server } from "socket.io";
import { registerHandlers } from "./handlers";
import { LobbyBroadcaster } from "./lobby";
import { startStatusLoop } from "./status-loop";
import { InMemorySessionStore } from "./store";
import type { AppServer } from "./types";

const PORT = Number(process.env.PORT ?? 4000);
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io: AppServer = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"] },
});

const store = new InMemorySessionStore();
const lobby = new LobbyBroadcaster(io, store);

registerHandlers(io, store, lobby);
const statusLoop = startStatusLoop(store, lobby);

httpServer.listen(PORT, () => {
  console.log(`socket-server listening on :${PORT}`);
  console.log(`allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});

const shutdown = (signal: string): void => {
  console.log(`${signal} received, shutting down`);
  clearInterval(statusLoop);
  void io.close(() => httpServer.close(() => process.exit(0)));
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
