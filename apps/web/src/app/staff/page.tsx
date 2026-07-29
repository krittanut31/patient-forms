/**
 * The right-hand pane before anyone is opened. Only ever seen on desktop — on a
 * phone the list occupies the whole screen until a row is tapped.
 */
export default function StaffIndexPage() {
  return (
    <div className="flex h-full items-center justify-center px-6 py-16">
      <div className="max-w-sm text-center">
        <h2 className="text-base font-medium text-ink">
          Choose a patient to watch their form
        </h2>
        <p className="mt-1.5 text-sm text-ink-muted">
          Anyone marked <span className="font-medium text-status-idle">Idle</span>{" "}
          has stopped partway through and may be stuck. Start there.
        </p>
      </div>
    </div>
  );
}
