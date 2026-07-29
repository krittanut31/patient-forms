import { SessionDetail } from "@/components/staff/SessionDetail";

/** `params` is a Promise in Next.js 16 — synchronous access was removed. */
export default async function StaffSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <SessionDetail sessionId={sessionId} />;
}
