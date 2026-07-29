import type { Metadata } from "next";
import { IntakeForm } from "@/components/patient/IntakeForm";

export const metadata: Metadata = {
  title: "Register at reception",
};

export default function PatientPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Register at reception
        </h1>
        <p className="mt-2 text-md text-ink-muted">
          Fill this in while you wait. You do not need to finish it before
          someone calls you.
        </p>
      </header>

      <IntakeForm />
    </main>
  );
}
