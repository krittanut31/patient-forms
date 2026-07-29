import Link from "next/link";

/**
 * A signpost, not a landing page. The two audiences arrive from different
 * places — patients from a QR code at the counter, staff from a bookmark — so
 * this mainly exists so neither lands on a 404.
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-xl font-semibold tracking-tight">Outpatient intake</h1>

      <div className="flex flex-col gap-3">
        <Link
          href="/patient"
          className="rounded-panel border border-line bg-surface px-4 py-4 hover:border-accent"
        >
          <span className="block text-md font-medium">I am a patient</span>
          <span className="mt-1 block text-sm text-ink-muted">
            Fill in your details while you wait
          </span>
        </Link>

        <Link
          href="/staff"
          className="rounded-panel border border-line bg-surface px-4 py-4 hover:border-accent"
        >
          <span className="block text-md font-medium">I work here</span>
          <span className="mt-1 block text-sm text-ink-muted">
            See who is filling in a form right now
          </span>
        </Link>
      </div>
    </main>
  );
}
