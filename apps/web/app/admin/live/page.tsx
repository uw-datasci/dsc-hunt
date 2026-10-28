import type { AdminProgressResponse } from "@dsc-hunt/types";
import { AdminShell } from "@/components/admin/admin-shell";
import { LiveProgress } from "@/components/admin/live-progress";
import { proxyApiJson } from "@/lib/api/proxy";
import { getAccessToken } from "@/lib/auth/session";
import { getCurrentEvent } from "@/lib/event/current";

export const dynamic = "force-dynamic";

/** Matches the API's fixed number of riddle positions. */
const TOTAL_RIDDLES = 6;

export default async function AdminLivePage() {
  const [event, accessToken] = await Promise.all([getCurrentEvent(), getAccessToken()]);
  const result = event
    ? await proxyApiJson<AdminProgressResponse>(
        `/events/${encodeURIComponent(event.id)}/admin/progress`,
        { cache: "no-store" }
      )
    : null;

  return (
    <AdminShell title="Live">
      {event ? (
        <LiveProgress
          event={event}
          initialProgress={result?.data ?? null}
          accessToken={accessToken}
          totalRiddles={TOTAL_RIDDLES}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          No event found. Check the API is running and migrations have been applied.
        </p>
      )}
    </AdminShell>
  );
}
