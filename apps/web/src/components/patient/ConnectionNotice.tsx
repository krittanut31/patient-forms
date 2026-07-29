import type { ConnectionState } from "@/lib/use-patient-session";

/**
 * Only speaks up when something is wrong. A permanent "connected" badge would
 * train people to ignore the one place the message matters.
 */
export function ConnectionNotice({ state }: { state: ConnectionState }) {
  return (
    <div aria-live="polite">
      {state !== "online" && (
        <p className="rounded-panel border border-status-idle bg-status-idle-wash px-4 py-3 text-base text-ink">
          {state === "connecting"
            ? "Reconnecting to reception."
            : "You are offline."}{" "}
          Keep filling in the form — what you have typed is safe and will be
          sent as soon as the connection is back.
        </p>
      )}
    </div>
  );
}
