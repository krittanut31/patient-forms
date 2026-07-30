"use client";

import { useTranslations } from "next-intl";
import type { FieldStateKind } from "@/lib/field-state";

const TINT: Record<FieldStateKind, string> = {
  empty: "text-ink-muted",
  valid: "text-status-typing",
  invalid: "text-danger",
};

/**
 * Three states, three shapes — not three colours.
 *
 * Under ward lighting on a cheap screen the difference between a green tick and
 * a red cross can wash out; the difference between a tick, a cross and an empty
 * outline does not. The label goes to screen readers either way.
 */
export function FieldStateMark({ state }: { state: FieldStateKind }) {
  const t = useTranslations("staff.fieldState");
  const label = t(state);

  return (
    <span className={`inline-flex ${TINT[state]}`} title={label}>
      <span className="sr-only">{label}</span>
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="size-4"
      >
        {state === "valid" && <path d="M4 10.5 8.5 15 16 5.5" />}
        {state === "invalid" && (
          <>
            <path d="M10 3.5 18 17H2z" />
            <path d="M10 8.5v3.2" />
            <path d="M10 14.4v.2" />
          </>
        )}
        {state === "empty" && (
          <circle cx="10" cy="10" r="6.2" strokeDasharray="2.5 2.8" />
        )}
      </svg>
    </span>
  );
}
