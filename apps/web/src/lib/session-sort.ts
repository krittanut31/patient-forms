import { formatTicket } from "@patient-forms/shared";
import type { SessionStatus, SessionSummary } from "@patient-forms/shared";

export type SortKey = "needs-help" | "name" | "progress" | "recent";

/** Order of the dropdown. The labels are looked up per locale at render. */
export const SORT_KEYS: SortKey[] = ["needs-help", "recent", "progress", "name"];

/**
 * Default order, from the brief: longest idle first, then new, then typing.
 *
 * `disconnected` is not in the brief's list. It sits directly behind `idle`
 * here because a form that stopped mid-way is the same kind of problem — a dead
 * tablet or a patient who wandered off — and staff should see it before the
 * people who are getting on with it fine.
 */
/** An unnamed session sorts under `~` + its ticket, which lands after any name. */
const nameKey = (session: SessionSummary): string =>
  session.displayName ?? `~${formatTicket(session.ticket)}`;

const URGENCY: Record<SessionStatus, number> = {
  idle: 0,
  disconnected: 1,
  new: 2,
  typing: 3,
  submitted: 4,
};

export function sortSessions(
  sessions: SessionSummary[],
  key: SortKey,
): SessionSummary[] {
  const sorted = [...sessions];

  switch (key) {
    case "name":
      // Nobody has a name until two fields arrive, so the unnamed sort by their
      // ticket — which is also arrival order, and it keeps them together at one
      // end of the list rather than scattered through it.
      return sorted.sort((a, b) =>
        nameKey(a).localeCompare(nameKey(b), undefined, {
          sensitivity: "base",
        }),
      );

    case "progress":
      return sorted.sort(
        (a, b) =>
          a.filledCount - b.filledCount || a.lastActiveAt - b.lastActiveAt,
      );

    case "recent":
      return sorted.sort((a, b) => b.lastActiveAt - a.lastActiveAt);

    case "needs-help":
    default:
      return sorted.sort(
        (a, b) =>
          URGENCY[a.status] - URGENCY[b.status] ||
          // Within a band, the one who has been waiting longest goes first.
          a.lastActiveAt - b.lastActiveAt,
      );
  }
}

/** Submitted sessions get their own group rather than vanishing on submit. */
export function splitBySubmitted(sessions: SessionSummary[]): {
  active: SessionSummary[];
  submitted: SessionSummary[];
} {
  return {
    active: sessions.filter((s) => s.status !== "submitted"),
    submitted: sessions.filter((s) => s.status === "submitted"),
  };
}

export function countAttention(sessions: SessionSummary[]): {
  filling: number;
  stuck: number;
} {
  return {
    filling: sessions.filter((s) => s.status === "typing" || s.status === "new")
      .length,
    stuck: sessions.filter(
      (s) => s.status === "idle" || s.status === "disconnected",
    ).length,
  };
}
