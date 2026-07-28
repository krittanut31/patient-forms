# Project brief — Agnos front-end assignment

You are building a production-quality take-home assignment for a healthtech company. Treat this as a real product for a hospital outpatient department, not a demo. Code quality, responsiveness, and UX judgement are explicitly graded.

## Locked tech stack

Do not substitute any of these.

- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: TailwindCSS
- **Real-time**: WebSockets — Socket.IO on a standalone Node server
- **Hosting**: Next.js app on Vercel, socket server on Railway or Render
- **Persistence**: in-memory store on the socket server. No database. Isolate it behind a small `SessionStore` interface so it could be swapped for Redis later, and say so in the README.

## What the product does

Two audiences, one shared live session.

**Patients** fill in an intake form on their own phone or a tablet at the counter.

**Staff** watch a live list of everyone currently filling in a form, and can open any one of them to see the form fill in field by field. The point is not surveillance — it is so a nurse can see that the elderly patient in chair 3 has been stuck on the address field for four minutes, and go help.

Every design decision should be checked against that sentence.

## Architecture

Three layers, two separate channel types.

```
Patient form  ──debounce──▶  Socket server  ──▶  Staff lobby   (summary, throttled)
                                    │
                                    └────────▶  Staff detail  (full patches, on demand)
```

The critical rule: **the lobby and the detail view get different payloads.** If 30 patients are typing at once, broadcasting every keystroke patch to the lobby will re-render the whole list constantly for data it does not display. Lobby gets a small summary object throttled to ~1.5s. Detail gets full field-level patches debounced at 300ms, and only for the one session the staff member has opened.

### Event contract

Define these in a shared `types/` module imported by both apps. Do not let the client and server drift.

```ts
type SessionStatus = 'new' | 'typing' | 'idle' | 'submitted' | 'disconnected'

type FieldPatch = {
  sessionId: string
  field: keyof PatientForm
  value: string
  isValid: boolean
  at: number
}

type SessionSummary = {
  sessionId: string
  displayName: string      // real name once entered, fallback label before that
  status: SessionStatus
  filledCount: number
  totalFields: number
  invalidCount: number
  startedAt: number
  lastActiveAt: number
}
```

Patient → server: `session:init`, `session:patch`, `session:submit`

Staff → server: `lobby:join`, `session:join`, `session:leave`

Server → staff: `lobby:snapshot`, `lobby:update`, `lobby:remove`, `session:snapshot`, `session:patch`

`*:snapshot` events exist so a staff member who opens a screen late still sees everything already entered. This is not optional — a client that only receives incremental patches will show a half-empty form.

### Status is derived on the server, not declared by the client

Never let the browser send "I am idle". Derive it from event timestamps so a dropped connection cannot leave a session stuck in the wrong state.

- `new` — session created, no input yet
- `typing` — input received within the last 4 seconds
- `idle` — connected but silent for over 30 seconds
- `submitted` — form submitted
- `disconnected` — socket closed

Run a single interval on the server that re-evaluates statuses and emits `lobby:update` for anything that changed. One timer for all sessions, not one timer per session.

## Feature requirements

### Patient form

Fields, in this order:

| Field | Required | Notes |
|---|---|---|
| First name | yes | |
| Middle name | no | |
| Last name | yes | |
| Date of birth | yes | must be in the past, reasonable age range |
| Gender | yes | select, include a prefer-not-to-say option |
| Phone number | yes | validate as a Thai mobile number, accept common formats |
| Email | no | must be valid if provided |
| Address | yes | textarea |
| Preferred language | yes | select |
| Nationality | yes | select with search, default Thai |
| Emergency contact name | no | |
| Emergency contact relationship | no | |
| Religion | no | |

Requirements:

- Use `react-hook-form` with `zod` for validation. Validate on blur, re-validate on change once a field has been touched — do not scream at someone mid-typing.
- Emit a patch on every change, debounced 300ms for free-text fields, immediate for selects and dates.
- **Send invalid values too**, flagged with `isValid: false`. Staff need to see that the patient typed a malformed phone number — hiding it defeats the purpose.
- Mobile-first. Correct `inputMode` and `autoComplete` on every input. Touch targets at least 44px. Assume some patients are elderly and using this one-handed.
- Persist the `sessionId` in `sessionStorage` so a refresh rejoins the same session rather than creating a duplicate row in the staff list.

### Staff list

- Live table or card list of every active session.
- Columns: patient name, status, progress (filled / total), how long since last activity, count of fields failing validation.
- Before a name is entered, show a stable fallback label such as `New patient #A3F2` derived from the session id. Swap to the real name as soon as first and last name arrive.
- Default sort puts the people who need help first — longest idle at the top, then new, then typing, then submitted. Let the user re-sort.
- Status must be legible without relying on colour alone: pair each colour with a label or icon.
- Submitted sessions move to a separate group and stay visible for a while rather than vanishing on submit. Empty abandoned sessions get cleaned up server-side after 5 minutes.
- Header shows counts: how many are actively filling, how many are stuck.

### Staff detail

- Every form field with its current value, updating live.
- Briefly highlight a field when it changes so the eye catches the update.
- Clearly mark fields that are empty, valid, and invalid — three distinct states.
- Show which field the patient currently has focused, if you can pipe that through. This is the single most useful thing on the screen for the "go help them" use case.
- A relative timestamp for last activity that ticks on its own.

### Responsive behaviour

- Desktop: master-detail. List on the left at roughly 35%, detail on the right. Staff should not lose their place in the list when opening someone.
- Mobile: full-screen list, tapping a row pushes to a full-screen detail with a back control.
- The patient form is a single column at every size. Do not put a two-column form on a phone.

## Design direction

This is a hospital screen used under time pressure, not a landing page. Aim for calm, dense, and highly legible.

- Pin a small token system first — 5 or 6 named colours, a type scale, spacing — and derive everything from it. Do not reach for default Tailwind blue-500 everywhere.
- Avoid the generic AI-app look: no cream-and-terracotta palette, no gradient hero, no glassmorphism, no rounded-3xl cards floating on a gradient. Pick a direction that suits a clinical setting and commit to it.
- Spend your one bold move on the status system — the thing that makes a glance at the list instantly readable. Keep everything else quiet.
- Copy matters. Buttons say what happens. Empty states tell staff what to do next. No filler microcopy.
- Baseline quality floor, unannounced: visible keyboard focus, `prefers-reduced-motion` respected, `aria-live` on status changes, labels tied to inputs.

## Technical constraints — these will bite you

1. **Vercel serverless cannot hold a WebSocket open.** The socket server must be a separate long-running Node process deployed elsewhere. The Next.js app connects to it via `NEXT_PUBLIC_SOCKET_URL`. Configure CORS on the socket server for the Vercel domain.
2. **Put the socket provider in `app/staff/layout.tsx`, not in the page.** If it lives in the page, navigating from the list to a detail view tears down and re-establishes the connection on every click. One connection per staff tab, held by the layout; pages only join and leave rooms.
3. **Always leave a room on unmount.** The detail view's `useEffect` cleanup must emit `session:leave`. Without it, a staff member who browses ten patients ends up subscribed to ten firehoses.
4. Handle reconnection: on `connect`, re-join whatever rooms this client should be in and re-request a snapshot. Do not assume the first connect is the only connect.
5. Never put the full form state in a single React state object that every field subscribes to — that re-renders the entire form on every keystroke. Let `react-hook-form` keep inputs uncontrolled.

## Deliverables

- Monorepo or two clearly separated folders — `apps/web` and `apps/socket-server` — with one command to run both locally.
- `README.md`: what it is, how to run it, environment variables, deployed URLs, and a short list of anything you built beyond the brief.
- `docs/development-plan.md` covering four sections the brief asks for explicitly:
  - **Project structure** — the folder layout and why
  - **Design** — UI/UX decisions per breakpoint, and the reasoning
  - **Component architecture** — the main components and what each owns
  - **Real-time synchronisation flow** — how updates travel, including the lobby/detail split, snapshot-on-join, and server-derived status

## How to work

1. Start by proposing the folder structure and the event contract. Wait for my sign-off before writing feature code.
2. Then build in this order: socket server and in-memory store → patient form → staff list → staff detail → responsive polish → docs.
3. Show me the design token plan before you build any UI.
4. When a requirement is ambiguous, ask rather than guess. Do not invent extra features I did not ask for.
5. Keep commits small and meaningfully named.
