"use client";

import { Badge } from "@mantine/core";
import { useTranslations } from "next-intl";
import type { SessionStatus } from "@patient-forms/shared";

/**
 * Weight is inverted from the usual badge treatment: only `idle` is filled.
 * If every status were equally saturated, urgency would read as decoration and
 * the one row a nurse needs to see would not stand out from the four that are
 * fine.
 */
const CHIP: Record<SessionStatus, string> = {
  idle: "bg-status-idle text-surface border-status-idle",
  new: "border-status-new/40 text-status-new bg-status-new/10",
  typing: "border-status-typing/40 text-status-typing bg-status-typing/10",
  submitted:
    "border-status-submitted/40 text-status-submitted bg-status-submitted/10",
  disconnected:
    "border-status-disconnected/40 text-status-disconnected bg-status-disconnected/10",
};

export const RAIL: Record<SessionStatus, string> = {
  idle: "bg-status-idle",
  new: "bg-status-new",
  typing: "bg-status-typing",
  submitted: "bg-status-submitted",
  disconnected: "bg-status-disconnected",
};

/** Colour alone is never the signal — every chip carries a glyph and a word. */
function Glyph({ status }: { status: SessionStatus }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    "aria-hidden": true,
    className: "size-3.5 shrink-0",
  };

  switch (status) {
    case "idle": // a clock: this one is about elapsed time
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5.5l3.5 2" />
        </svg>
      );
    case "typing": // a live trace, as on a monitor
      return (
        <svg {...common}>
          <path d="M2 12h4l2.5-6 4 13 3-8 2.5 3H22" />
        </svg>
      );
    case "new":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" strokeDasharray="3 3.2" />
        </svg>
      );
    case "submitted":
      return (
        <svg {...common} strokeLinejoin="round">
          <path d="M4 12.5 9.5 18 20 6.5" />
        </svg>
      );
    case "disconnected":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M6 18 18 6" />
        </svg>
      );
  }
}

/**
 * A Mantine `Badge` carrying the palette above rather than a Mantine colour.
 *
 * The status system is the one place this UI is allowed to be loud, so the
 * variant weighting stays hand-set — `Badge color="orange"` would make idle
 * look like the other four.
 */
export function StatusChip({ status }: { status: SessionStatus }) {
  const t = useTranslations("staff.status");

  return (
    <Badge
      variant="outline"
      radius="xs"
      leftSection={<Glyph status={status} />}
      classNames={{
        root: `h-auto border px-2 py-0.5 normal-case tracking-normal ${CHIP[status]}`,
        label: "text-xs font-semibold",
      }}
    >
      {t(status)}
    </Badge>
  );
}
