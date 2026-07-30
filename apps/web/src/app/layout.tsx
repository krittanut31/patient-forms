import type { Metadata, Viewport } from "next";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
// globals.css first, and not for tidiness: it opens with the `@layer` statement
// that fixes the cascade order, and a layer's position is decided by where it
// is first declared. Import Mantine's stylesheets above this line and `mantine`
// gets declared before Tailwind's layers exist, which puts Preflight on top of
// it and strips the border off every input.
import "./globals.css";
import "@mantine/core/styles.layer.css";
import "@mantine/dates/styles.layer.css";
import { AppProviders } from "@/components/AppProviders";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return { title: t("title"), description: t("description") };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom stays available. Pinching a form is often the only way an older
  // patient can read it, and locking that out is a real accessibility failure.
  maximumScale: 5,
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    // `dvh` rather than `vh`: on a phone the address bar makes `100vh` taller
    // than what is actually on screen, which pushes the bottom of the staff
    // list under the browser chrome where nobody can reach it.
    <html lang={locale} className="h-dvh" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript forceColorScheme="light" />
      </head>
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        <NextIntlClientProvider>
          <AppProviders>
            {/* One switcher for the whole app, pinned to the corner of the
                viewport rather than repeated in three page headers. Fixed, not
                absolute: the intake form is fourteen fields long and someone
                who realises halfway down that they want Thai should not have
                to scroll back up for it. The headers underneath keep a
                right-hand gap so nothing ends up behind it. */}
            <div className="fixed top-3 right-3 z-50">
              <LanguageSwitcher />
            </div>

            {children}
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
