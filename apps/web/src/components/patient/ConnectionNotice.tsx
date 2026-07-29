import { Alert } from "@mantine/core";
import type { ConnectionState } from "@/lib/use-patient-session";

/**
 * Only speaks up when something is wrong. A permanent "connected" badge would
 * train people to ignore the one place the message matters.
 */
export function ConnectionNotice({ state }: { state: ConnectionState }) {
  return (
    <div aria-live="polite">
      {state !== "online" && (
        <Alert
          variant="light"
          radius="lg"
          title={
            state === "connecting" ? "Reconnecting to reception" : "You are offline"
          }
          classNames={{
            root: "border border-status-idle bg-status-idle-wash",
            title: "text-ink",
            body: "text-base text-ink",
          }}
        >
          Keep filling in the form — what you have typed is safe and will be sent
          as soon as the connection is back.
        </Alert>
      )}
    </div>
  );
}
