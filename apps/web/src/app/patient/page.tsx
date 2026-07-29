import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
        {/* Above the form, not tucked in a corner: someone who cannot read the
            heading needs to reach this before they read anything else. */}
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-md text-ink-muted">{t("intro")}</p>
      </header>

      <IntakeForm />
    </main>
  );
}
