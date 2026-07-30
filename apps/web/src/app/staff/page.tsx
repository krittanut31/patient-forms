import { getTranslations } from "next-intl/server";

/**
 * The right-hand pane before anyone is opened. Only ever seen on desktop — on a
 * phone the list occupies the whole screen until a row is tapped.
 */
export default async function StaffIndexPage() {
  const t = await getTranslations("staff");

  return (
    <div className="flex h-full items-center justify-center px-6 py-16">
      <div className="max-w-sm text-center">
        <h2 className="text-base font-medium text-ink">{t("chooseHeading")}</h2>
        <p className="mt-1.5 text-sm text-ink-muted">
          {t.rich("chooseBody", {
            idle: (chunks) => (
              <span className="font-medium text-status-idle">{chunks}</span>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
