import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { IntakeForm } from "@/components/patient/IntakeForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("patient");
  return { title: t("title") };
}

export default async function PatientPage() {
  const t = await getTranslations("patient");

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        {/* Clear of the switcher pinned to the top right in the root layout. */}
        <h1 className="pr-28 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-md text-ink-muted">{t("intro")}</p>
      </header>

      <IntakeForm />
    </main>
  );
}
