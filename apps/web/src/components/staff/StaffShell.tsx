"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { SessionList } from "./SessionList";

/**
 * Master-detail on desktop, a stack on mobile.
 *
 * The list is rendered here in the layout rather than in the page, so opening a
 * patient does not unmount it. That is what keeps the scroll position and the
 * chosen sort order intact while a nurse works through the list.
 */
export function StaffShell({ children }: { children: ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const detailOpen = segment !== null;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside
        className={[
          "min-w-0 flex-col border-r border-line bg-surface",
          // 35% as the brief asks, floored so it stays usable on a small laptop
          // and capped so it does not become a corridor on an ultrawide.
          "w-full lg:flex lg:w-[35%] lg:max-w-2xl lg:min-w-80",
          // On a phone the list and the detail are two screens, not two panes.
          detailOpen ? "hidden" : "flex",
        ].join(" ")}
      >
        <SessionList selectedId={segment} />
      </aside>

      <main
        className={[
          // Not scrollable itself — the detail view scrolls its own field list
          // under a pinned header. Two nested scroll containers would fight
          // each other, and on iOS the outer one rubber-bands over the inner.
          "min-w-0 flex-1 overflow-hidden",
          detailOpen ? "block" : "hidden lg:block",
        ].join(" ")}
      >
        {children}
      </main>
    </div>
  );
}
