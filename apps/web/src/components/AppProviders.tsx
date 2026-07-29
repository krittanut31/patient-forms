"use client";

import type { ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
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
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      forceColorScheme="light"
    >
      {children}
    </MantineProvider>
  );
}
