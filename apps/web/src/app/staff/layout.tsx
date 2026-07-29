import type { Metadata } from "next";
import { StaffShell } from "@/components/staff/StaffShell";
import { StaffSocketProvider } from "@/components/staff/StaffSocketProvider";

export const metadata: Metadata = {
  title: "Reception — live intake",
};

/**
 * The socket provider lives here, not in the pages.
 *
 * One connection per staff tab: navigating from the list to a patient and back
 * only joins and leaves rooms, it never rebuilds the connection.
 */
export default function StaffLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <StaffSocketProvider>
      <StaffShell>{children}</StaffShell>
    </StaffSocketProvider>
  );
}
