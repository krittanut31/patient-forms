"use client";

import { useEffect, useState } from "react";

/**
 * A clock the whole list shares.
 *
 * "Idle for 4m 12s" has to tick on its own or it silently goes stale, but a
 * timer per row would mean thirty timers firing out of step. One interval here
 * re-renders the list once a second instead.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
