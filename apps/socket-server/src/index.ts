import { createServer } from "node:http";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@patient-forms/shared";

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

export const io = new Server<ClientToServerEvents, ServerToClientEvents>(
  httpServer,
  { cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"] } },
);

// Event handlers and the session store are wired up next.

httpServer.listen(PORT, () => {
  console.log(`socket-server listening on :${PORT}`);
  console.log(`allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});
