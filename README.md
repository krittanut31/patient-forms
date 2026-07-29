# Outpatient intake

A patient registration form that reception staff can watch being filled in, live.

Patients complete an intake form on their own phone or on a tablet at the
counter. Staff see a list of everyone currently filling one in, and can open any
one of them to watch it fill in field by field. The point is not surveillance —
it is so a nurse can see that the patient in chair 3 has been stuck on the
address field for four minutes, and go help.

## Status

| Part | State |
| --- | --- |
| Socket server, session store, derived status | Done |
| Shared event contract | Done |
| Patient form | Done |
| Staff list | Not started |
| Staff detail | Not started |
| `docs/development-plan.md` | Not started |

`/staff` is linked from the home page but does not exist yet — it returns 404.

## Requirements

- Node.js 20.9 or newer (Next.js 16 minimum)
- npm 9 or newer

## Running it locally

```bash
git clone <this repo>
cd patient-forms
npm install
```

Install at the **repository root only**. This is an npm workspace; running
`npm install` inside `apps/web` will fight the hoisted dependency tree.

Then set up the two environment files:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/socket-server/.env.example apps/socket-server/.env
```

On Windows PowerShell:

```powershell
Copy-Item apps\web\.env.example apps\web\.env.local
Copy-Item apps\socket-server\.env.example apps\socket-server\.env
```

The defaults in those files already point at each other on localhost, so you can
leave them alone for local development.

Start both processes with one command:

```bash
npm run dev
```

| | URL |
| --- | --- |
| Next.js app | http://localhost:3000 |
| Patient form | http://localhost:3000/patient |
| Socket server | http://localhost:4000 |
| Socket server health check | http://localhost:4000/health |

`Ctrl+C` stops both. Log lines are prefixed `web` and `socket` in different
colours.

### Running one side at a time

```bash
npm run dev:web      # Next.js only
npm run dev:socket   # socket server only, with watch
```

### Checks

```bash
npm run typecheck    # all three workspaces
npm run lint
npm run build
```

### Trying it on a real phone

The form is built mobile-first and is worth looking at on a real device.

```bash
npm run dev --workspace @patient-forms/web -- --hostname 0.0.0.0
```

The `--` matters. Without it npm swallows `--hostname` as one of its own flags
and hands Next.js a stray positional argument.

Then set `NEXT_PUBLIC_SOCKET_URL` in `apps/web/.env.local` to your machine's LAN
address rather than `localhost` — otherwise the phone tries to reach a socket
server on itself — and add that address to `CORS_ORIGIN` in
`apps/socket-server/.env`.

### Seeing both sides at once

Open the patient form and the staff view in two different browser profiles, or
put one in a private window. The session id lives in `sessionStorage`, which is
shared across tabs of the same profile, so two normal tabs would join the same
session instead of showing you two patients.

## Environment variables

### `apps/web`

| Variable | Default | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:4000` | Where the browser opens its socket. Must be reachable from the client, not from the Next.js server. |

### `apps/socket-server`

| Variable | Default | What it does |
| --- | --- | --- |
| `PORT` | `4000` | Port to listen on. Hosting platforms usually set this for you. |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated list of origins allowed to connect. |

## Layout

```
apps/
  web/             Next.js app — patient form and staff views
  socket-server/   standalone Socket.IO server
packages/
  shared/          the event contract both sides import
```

`packages/shared` is consumed as TypeScript source rather than a build output,
so there is no build step to remember during development. The web app lists it
in `transpilePackages`; the socket server runs through `tsx`.

## How the real-time side works

The lobby and the detail view are fed differently on purpose. If thirty patients
are typing at once, pushing every keystroke to the staff list would re-render the
whole list constantly for data it does not display.

- **Lobby** receives a small summary per session, throttled to one update per
  1.5s per session.
- **Detail** receives full field-level patches, but only for the one session a
  staff member has opened.

Both screens are sent a snapshot when they join — including after a reconnect —
so someone who opens a screen late sees everything already entered rather than a
half-empty form.

Status (`new`, `typing`, `idle`, `submitted`, `disconnected`) is derived on the
server from event timestamps. The browser never declares its own status, so a
dropped connection cannot leave a session stuck reading `typing`. A single
interval re-evaluates every session, rather than one timer per session.

### Persistence

There is no database. Sessions live in memory on the socket server behind a
small `SessionStore` interface (`apps/socket-server/src/store.ts`), so the Map
could be replaced with Redis without touching the handlers. Every method on that
interface is `async` even though a Map needs none of it — a synchronous
interface would have to be rewritten at every call site to put Redis behind it,
which is the one thing the seam exists to allow.

Restarting the socket server clears every session.

## Deploying

The Next.js app goes on Vercel. **The socket server cannot** — a serverless
function cannot hold a WebSocket open — so it needs a long-running host such as
Railway or Render.

1. Deploy `apps/socket-server` to Railway or Render. It has no build step; the
   start command is `npm start` from that directory.
2. Set `CORS_ORIGIN` on that service to your Vercel domain.
3. Deploy `apps/web` to Vercel with the repository root as the project root.
4. Set `NEXT_PUBLIC_SOCKET_URL` on Vercel to the socket server's public URL.

Deployed URLs: _not deployed yet._

## Beyond the brief

- **`session:focus`** — the brief asks for the patient's focused field on the
  staff detail view but does not include an event for it, so the contract adds
  one, plus `focusedField` on the session snapshot.
- **Reconnect resync** — on reconnect the patient's form pushes its current
  values back to the server. Anything typed while the connection was down exists
  only in the browser, and without this staff would keep looking at a stale form.
- **Nationality combobox** — built by hand with real ARIA listbox semantics and
  keyboard support rather than a native `select`, because the list is over a
  hundred entries.
- **Submit flushes pending debounces** — the last few characters typed before
  pressing submit would otherwise never leave the browser.
