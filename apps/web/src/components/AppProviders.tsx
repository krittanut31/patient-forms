"use client";

import type { ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { useLocale } from "next-intl";
import "dayjs/locale/th";
import { cssVariablesResolver, theme } from "@/lib/mantine-theme";

/**
 * The Mantine provider, held in a client component of its own.
 *
 * `cssVariablesResolver` is a function, and functions cannot cross from a
 * server component into a client one — passing it straight from the root
 * layout fails the production build with "Functions cannot be passed directly
 * to Client Components". Importing it on this side of the boundary is the fix.
 *
 * `forceColorScheme` rather than a toggle: the app is light-only, see the note
 * on the palette in globals.css.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const locale = useLocale();

  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="light"
    >
      {/* Mantine's calendar runs on dayjs, which has its own locale registry —
          without this the date of birth picker keeps English month names on an
          otherwise Thai form. */}
      <DatesProvider settings={{ locale }}>{children}</DatesProvider>
    </MantineProvider>
  );
}
