import type { Metadata, Viewport } from "next";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}
