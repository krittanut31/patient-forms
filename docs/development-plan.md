# Development plan

Everything here is checked against one sentence: a nurse should be able to see
that the patient in chair 3 has been stuck on the address field for four
minutes, and go help. Where a decision could go either way, that is the tie
breaker.

---

## 1. Project structure

```
apps/
  web/                        Next.js app — both audiences
    src/app/
      layout.tsx              root shell, tokens, viewport
      page.tsx                signpost to the two audiences
      patient/page.tsx        the intake form
      staff/
        layout.tsx            owns the socket and the list
        page.tsx              empty right-hand pane
        [sessionId]/page.tsx  one patient's form, live
    src/components/
      patient/                form field rendering
      staff/                  lobby and detail rendering
    src/lib/                  logic with no JSX in it
  socket-server/              standalone Socket.IO process
    src/
      index.ts                bootstrap, CORS, health
      handlers.ts             every event in the contract
      domain.ts               status derivation, summaries, expiry
      store.ts                SessionStore seam + in-memory implementation
      lobby.ts                throttled lobby broadcaster
      status-loop.ts          the one interval
packages/
  shared/src/                 the event contract both apps import
docs/
```

**Why two apps rather than one.** Vercel's serverless functions cannot hold a
WebSocket open, so the socket server has to be a long-running process somewhere
else. That is not a preference, it is the constraint that shapes the whole
deployment: the Next.js app is static and edge-friendly, the socket server is
stateful and single-instance.

**Why a `shared` package rather than duplicated types.** The client and server
disagreeing about an event shape is the failure mode that does not show up until
production, because both sides typecheck fine in isolation. One module, imported
by both, makes that impossible. It carries the event map, the session types, and
the timing constants — so the UI can say "idle after 30 seconds" without a second
copy of the number that can drift from what the server actually does.

**Why `shared` ships TypeScript source, not a build.** A build step between the
two apps is a step someone forgets during development, and the symptom is stale
types rather than an error. The web app lists it in `transpilePackages`; the
socket server runs through `tsx`. Neither needs `shared` compiled first.

**Why `lib/` is separate from `components/`.** Everything in `lib/` is testable
without rendering anything: the zod schema, the sort order, the elapsed-time
formatting, the socket hooks. That split is what made it possible to verify the
list ordering rules and the three field states directly, rather than by
inspecting markup.

---

## 2. Design

### Direction

The reference object is the magnetic status board on a ward wall: dense rows,
flat colour, no ornament, readable from two metres. The interface neutral is a
cool grey biased toward the teal accent, which leaves the five status hues as the
only saturated things on screen.

Six core tokens (`canvas`, `surface`, `ink`, `ink-muted`, `line`, `accent`), a
separate semantic ramp for status, one type scale, a 4px spacing grid, and a
maximum corner radius of 6px anywhere in the system. All declared once in
`globals.css` and exposed through `@theme inline`, so no component contains a hex
value.

**Light only.** The palette had a dark variant behind `prefers-color-scheme`; it
was removed. A ward runs a dozen shared tablets and a wall display, and half of
them follow whatever the OS decided at six in the evening — a list read by
glancing at it should not change contrast under the person reading it depending
on which device they picked up. `color-scheme: light` on the root keeps the
native pickers and scrollbars in the same palette as the rest.

### Mantine as the component layer

Controls come from Mantine 9; layout, spacing and colour stay in Tailwind. The
theme in `lib/mantine-theme.ts` re-points Mantine's semantic CSS variables at
the tokens above (`--mantine-color-error` → `--danger`, and so on) and replaces
its defaults for type scale, radius and input height, so adopting the library
did not import a second design system alongside the first. Mantine's stylesheet
is imported through its `styles.layer.css` build and `@layer mantine` is
declared before Tailwind's layers, which makes a utility class win over a
component style regardless of what order the bundler emits the two in.

What this bought: a searchable `Select` with real listbox semantics for
nationality and for the dialing code, and a `DateInput` whose calendar cannot
be navigated to a future date at all.

The accent is used for interaction only — focus rings, links, the submit button —
and never for status. Otherwise "this is clickable" and "this needs attention"
would compete for the same colour.

### The one bold move: inverted status weight

Most interfaces give every badge equal saturation, which flattens urgency into
decoration. Here only `idle` is filled: a solid chip, a tinted row, and a rail
thickened from 4px to 6px. Everything else is an outline chip on a plain row.
The result is that the people who need help are the only thing pulling the eye.

Every status is a colour **and** a glyph **and** a word. The glyphs are chosen
semantically — a clock for idle, because the point is elapsed time; a monitor
trace for typing; a dashed outline for new. Colour alone would fail for a
colour-blind nurse and for a washed-out screen, and both are common.

### Per breakpoint

**Patient form, every width.** Single column, always. A two-column form on a
phone is how people skip a field without noticing. Body type is 17px rather than
14px, inputs are 48px tall, and every input carries the right `inputMode` and
`autoComplete`. 17px also clears the 16px threshold below which iOS zooms the
page on focus — a zoom that then strands the rest of the form off-screen. Pinch
zoom stays enabled up to 5x, because for some of these patients it is the only
way to read the screen at all.

**Staff below 1024px.** The list is the whole screen. Tapping a row navigates to
the detail, which is also the whole screen, with a back control at the top left
sized as a real 44px target. Two screens, not two panes — a 35% column on a phone
would be unreadable and the detail beside it worse.

**Staff at 1024px and above.** Master-detail: the list at 35% on the left, the
detail filling the rest. The list is rendered by the layout rather than by the
page, so opening a patient does not unmount it. That is what preserves the scroll
position and the chosen sort while a nurse works down the list — losing your
place after every patient is the thing that would make the screen unusable in
practice.

1024px is the split point because it is roughly where a landscape tablet stops
being a phone and starts being a workstation. A portrait tablet at the counter
gets the mobile treatment, which is correct: it is being held, not sat in front
of.

**Viewport height.** The staff screens are a fixed-height shell with internal
scrolling, sized in `dvh` rather than `vh`. With `vh` the mobile address bar
makes the viewport taller than what is actually visible, and the bottom of the
list ends up under the browser chrome.

### Copy

Buttons say what happens — "Send my details to reception", not "Submit". Empty
states say what to do next rather than stating the obvious: the empty lobby tells
staff to hand out the counter tablet. The connection notice only appears when
something is wrong; a permanent green "connected" badge trains people to ignore
the one place the message matters.

### Baseline

Visible focus on everything, never removed. `prefers-reduced-motion` honoured —
and the field-change flash degrades to a static tint rather than disappearing,
because it carries information, not decoration. `aria-live` on the count of
patients needing help and on the detail view's status. Every label tied to its
input. Tabular numerals anywhere digits tick or line up, so a running timer does
not make the row jitter sideways.

---

## 3. Component architecture

### Patient

| Component | Owns |
| --- | --- |
| `IntakeForm` | The `react-hook-form` instance, submit, and restoring a refreshed session |
| `FieldRow` | Picking the control for one field and subscribing to **only that field's** error |
| `PhoneField` | Dialing code and number as two controls over one stored string |
| `Field` | Label, hint and error markup for the multi-control fields only |
| `ConnectionNotice` | Saying something only when the socket is down |
| `usePatientSession` | The socket. Knows nothing about the form |

Single-control fields use Mantine's own `label` / `description` / `error` props
and never touch `Field`. The phone fields cannot: two components that each build
on `Input` inside one `Input.Wrapper` both claim the wrapper's `inputId`, and
two elements answering to the same id is a broken label, so those keep the
hand-written wrapper.

The re-render discipline is the load-bearing part. Inputs stay uncontrolled
under `register`. Each `FieldRow` calls `useFormState({ control, name })`, which
subscribes it to its own error and nothing else — reading `formState.errors` up
in `IntakeForm` would re-render all fourteen fields on every keystroke once any
one of them had been touched.

Two fields filter as they are typed rather than flagging afterwards: names drop
anything that is not a letter, a combining mark, a space or an apostrophe, and
phone numbers drop everything that is not a digit. The character is rewritten on
the element before `react-hook-form` reads the event, which keeps the input
uncontrolled. This is the one deliberate exception to "send invalid values too":
a digit in a name is not a near miss a nurse can act on, whereas a malformed
whole value — a phone number of the wrong length, an email with no `@` — still
travels with `isValid: false` exactly as before.

`usePatientSession` deliberately does not receive the form. It reports that a
resync is needed by bumping a token, and the form hands over its values in
response. That keeps the form as the single owner of form state, and it is also
what removed a ref being written during render.

Validation uses `mode: "onTouched"`: nothing is flagged until the patient leaves
a field, then it re-checks as they type so a correction clears the message
immediately. zod is defined per field as well as for the form, because every
patch carries an `isValid` flag — including for fields nobody has blurred yet —
and `react-hook-form`'s error state cannot answer that.

### Staff

| Component | Owns |
| --- | --- |
| `StaffSocketProvider` | The one socket for the tab, and the lobby summaries |
| `StaffShell` | The responsive master-detail split, and which pane shows |
| `SessionList` | Sorting, grouping, header counts, empty state |
| `SessionRow` | One row: rail, name, progress, elapsed time, status chip |
| `StatusChip` | The colour, glyph and word for a status |
| `SessionDetail` | Joining and leaving one room, and the live field list |
| `FieldStateMark` | Empty, valid or invalid as three shapes |

The provider sits in `app/staff/layout.tsx`. In a page it would be torn down and
rebuilt on every click from the list to a patient, losing the lobby feed and
re-requesting every snapshot. Pages only join and leave rooms.

One clock (`useNow`) drives every elapsed-time label, rather than a timer per
row, so thirty rows tick together instead of drifting apart.

---

## 4. Real-time synchronisation flow

```
                        ┌──────────── lobby room ─────────► staff list
                        │              summary,             (all sessions,
Patient form            │              throttled 1.5s        small payload)
   │                    │
   │ debounce 300ms     │
   │ (free text)        │
   │ immediate          │
   │ (selects, dates)   │
   ▼                    │
session:patch ──► socket server ──┐
session:focus       │             │
session:submit      │             └─ session room ────────► staff detail
                    │                full field patches     (one session,
              in-memory store        + focus, no throttle    on demand)
                    │
              status interval (500ms)
                    │
              lobby:update on any change
```

### The lobby and the detail get different payloads

This is the central rule. Thirty patients typing at once would push a re-render
of the whole staff list on every keystroke, for data the list does not even
display. So:

- **Lobby** receives `SessionSummary` — name, status, filled count, invalid
  count, timestamps. Throttled to one update per session per 1.5s.
- **Detail** receives `FieldPatch` — the actual field and value — but only for
  the one session that staff member has joined, and unthrottled, because the
  client already debounced it at 300ms.

Throttling is released by the status interval rather than by a timer per session,
so the server still runs on a single timer no matter how many patients are
connected.

### Snapshot on join, and on every reconnect

`lobby:join` answers with `lobby:snapshot`; `session:join` answers with
`session:snapshot`. Without these, a staff member who opens a screen late sees
only the changes that happen from that moment on — a half-empty form beside a
patient who has already filled in eleven fields.

Both clients re-join on the socket's `connect` event, not just the first one, so
a dropped connection repairs itself with a fresh snapshot rather than resuming a
patch stream it has holes in. The patient side does the mirror image: on
reconnect it pushes its current values, because anything typed while the
connection was down exists nowhere but that browser.

The detail view emits `session:leave` on unmount. Without it, a staff member who
browses ten patients ends up subscribed to ten firehoses at once.

### Status is derived on the server

The browser never declares its own status. It is computed from event timestamps:

| Status | Condition |
| --- | --- |
| `new` | Session exists, no input yet |
| `typing` | Input within the last 4 seconds |
| `idle` | Connected but silent for over 30 seconds |
| `submitted` | Form submitted |
| `disconnected` | Socket closed |

A single interval re-evaluates every session and emits `lobby:update` for
whatever changed. One timer for the whole server, not one per session.

Deriving it this way is what makes a dead browser safe: a tab that dies mid-form
cannot leave its row reading `typing` forever, because nothing is refreshing its
timestamp.

Two consequences worth stating:

`session:focus` deliberately does **not** refresh the activity clock. A patient
parked on the address field for four minutes is precisely the person staff need
surfaced as idle, and treating focus as activity would hide exactly the case this
product exists for.

The brief names no state for the 4–30 second window. It is held as `typing`
there, so `idle` keeps meaning "this person needs help" rather than "this person
paused to think".

### Writes are atomic

Handlers originally did get, mutate, save. Two patches arriving in the same tick
both read the state from before either had written, and whichever saved last
wiped out the other — six patches emitted together landed as four, silently.

`SessionStore.update(sessionId, mutate)` is now one indivisible
read-modify-write. The in-memory implementation has no `await` between its read
and its write, so nothing can interleave.

### Persistence and cleanup

There is no database. Sessions live in a `Map` behind the `SessionStore`
interface, so it could be swapped for Redis without touching a handler. Every
method is `async` even though a `Map` needs none of it: a synchronous interface
would have to be rewritten at every call site to put Redis behind it, which is
the one thing the seam exists to allow. The store also hands out clones rather
than live references, so code cannot mutate a record without saving it and still
appear to work — that is what surfaced the lost-update race above.

The same interval that derives status also expires sessions: empty abandoned ones
after 5 minutes, submitted ones after 10. Submitted sessions move to their own
group in the list rather than vanishing, because the person who just finished is
often the one staff need next.

---

## Known gaps

- No automated test suite in the repository. Behaviour was verified with
  throwaway scripts against a running server — the lobby throttle, the idle
  transition in real time, room leave actually stopping delivery, the lost-update
  race — but none of that is reproducible by anyone else.
- Nothing has been verified in a real browser. The change flash, the dropdown
  keyboard handling, the master-detail behaviour at the breakpoint and the iOS
  zoom threshold are all reasoned from the markup, not observed.
- The dialing code list is 32 entries chosen for a Bangkok outpatient
  department, not the full ITU set. Validation is exact for `+66` and a length
  check everywhere else — there is no libphonenumber, so a wrong-but-plausible
  number for another country will pass.
- A disconnected session that was partly filled in is never cleaned up. The brief
  specifies expiry only for empty and submitted sessions, and inventing a third
  rule was out of scope — but it means a patient who closes the tab halfway sits
  in the list, and in memory, indefinitely.
