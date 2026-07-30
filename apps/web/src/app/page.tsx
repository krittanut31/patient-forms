import Link from "next/link";
import { Stack, Title } from "@mantine/core";
import { getTranslations } from "next-intl/server";

/**
 * A signpost, not a landing page. The two audiences arrive from different
 * places — patients from a QR code at the counter, staff from a bookmark — so
 * this mainly exists so neither lands on a 404.
 */
export default async function Home() {
  const t = await getTranslations("home");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-12">
      <Title order={1} className="text-xl font-semibold tracking-tight">
        {t("heading")}
      </Title>

      <Stack gap="sm">
        <Link
          href="/patient"
          className="rounded-panel border border-line bg-surface px-4 py-4 hover:border-accent"
        >
          <span className="block text-md font-medium">{t("patientTitle")}</span>
          <span className="mt-1 block text-sm text-ink-muted">
            {t("patientBlurb")}
          </span>
        </Link>

        <Link
          href="/staff"
          className="rounded-panel border border-line bg-surface px-4 py-4 hover:border-accent"
        >
          <span className="block text-md font-medium">{t("staffTitle")}</span>
          <span className="mt-1 block text-sm text-ink-muted">
            {t("staffBlurb")}
          </span>
        </Link>
      </Stack>
    </main>
  );
}
