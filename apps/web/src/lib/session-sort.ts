import type { SessionStatus, SessionSummary } from "@patient-forms/shared";

export type SortKey = "needs-help" | "name" | "progress" | "recent";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "needs-help", label: "Who needs help" },
  { value: "recent", label: "Most recent activity" },
  { value: "progress", label: "Least progress" },
  { value: "name", label: "Name" },
];

/**
 * Default order, from the brief: longest idle first, then new, then typing.
 *
 * `disconnected` is not in the brief's list. It sits directly behind `idle`
 * here because a form that stopped mid-way is the same kind of problem — a dead
 * tablet or a patient who wandered off — and staff should see it before the
 * people who are getting on with it fine.
 */
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
      return sorted.sort((a, b) =>
        a.displayName.localeCompare(b.displayName, undefined, {
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
