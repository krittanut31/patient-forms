"use client";

import { Alert } from "@mantine/core";
import { useTranslations } from "next-intl";
import type { ConnectionState } from "@/lib/use-patient-session";

/**
 * Only speaks up when something is wrong. A permanent "connected" badge would
 * train people to ignore the one place the message matters.
 */
export function ConnectionNotice({ state }: { state: ConnectionState }) {
  const t = useTranslations("patient.connection");

  return (
    <div aria-live="polite">
      {state !== "online" && (
        <Alert
          variant="light"
          radius="lg"
          title={state === "connecting" ? t("reconnecting") : t("offline")}
          classNames={{
            root: "border border-status-idle bg-status-idle-wash",
            title: "text-ink",
            body: "text-base text-ink",
          }}
        >
          {t("body")}
        </Alert>
      )}
    </div>
  );
}
