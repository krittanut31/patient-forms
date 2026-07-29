export function SubmittedNotice() {
  return (
    <div
      role="status"
      className="rounded-panel border border-line bg-surface p-6 text-center"
    >
      <h2 className="text-xl font-semibold text-ink">Your details are with reception</h2>
      <p className="mt-3 text-md text-ink-muted">
        Please take a seat. A member of staff will call your name.
      </p>
      <p className="mt-4 text-sm text-ink-muted">
        If something was wrong, tell the person at the counter — they can see
        what you sent and correct it for you.
      </p>
    </div>
  );
}
