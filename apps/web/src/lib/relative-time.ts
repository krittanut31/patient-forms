/**
 * Compact elapsed time for the staff list, where the number ticks every second
 * and sits in a narrow column: "8s", "4m 12s", "1h 05m".
 *
 * Left untranslated on purpose. These are unit letters in a column of digits
 * read at a glance from two metres, not prose — "4 นาที 12 วินาที" would not
 * fit the column and would not be quicker to read. The spelled-out version
 * below, which screen readers and tooltips get, is translated.
 */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));

  if (total < 60) return `${total}s`;

  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes < 60) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
}

export type ElapsedParts = {
  unit: "seconds" | "minutes" | "hours";
  count: number;
};

/**
 * The same duration as a unit and a count, so the caller can put it into words
 * in its own language and let the plural rules fall where they fall.
 */
export function elapsedParts(ms: number): ElapsedParts {
  const total = Math.max(0, Math.floor(ms / 1000));
  if (total < 60) return { unit: "seconds", count: total };

  const minutes = Math.floor(total / 60);
  if (minutes < 60) return { unit: "minutes", count: minutes };

  return { unit: "hours", count: Math.floor(minutes / 60) };
}
