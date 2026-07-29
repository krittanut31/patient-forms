import type { Metadata, Viewport } from "next";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
// globals.css first, and not for tidiness: it opens with the `@layer` statement
// that fixes the cascade order, and a layer's position is decided by where it
// is first declared. Import Mantine's stylesheets above this line and `mantine`
// gets declared before Tailwind's layers exist, which puts Preflight on top of
// it and strips the border off every input.
import "./globals.css";
import "@mantine/core/styles.layer.css";
import "@mantine/dates/styles.layer.css";
import { AppProviders } from "@/components/AppProviders";

export const metadata: Metadata = {
  title: "Outpatient intake",
  description:
    "Patient registration for the outpatient department, with a live view for reception staff.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom stays available. Pinching a form is often the only way an older
  // patient can read it, and locking that out is a real accessibility failure.
  maximumScale: 5,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // `dvh` rather than `vh`: on a phone the address bar makes `100vh` taller
    // than what is actually on screen, which pushes the bottom of the staff
    // list under the browser chrome where nobody can reach it.
    <html lang="en" className="h-dvh" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript forceColorScheme="light" />
      </head>
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
