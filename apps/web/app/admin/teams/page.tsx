import type { AdminTeam } from "@dsc-hunt/types";
import { AdminShell } from "@/components/admin/admin-shell";
import { TeamsTable } from "@/components/admin/teams-table";
import { proxyApiJson } from "@/lib/api/proxy";
import { getCurrentEvent } from "@/lib/event/current";

export const dynamic = "force-dynamic";

/** Matches the API's fixed number of riddle positions. */
const TOTAL_RIDDLES = 6;

export default async function AdminTeamsPage() {
  const event = await getCurrentEvent();
  const result = event
    ? await proxyApiJson<{ teams: AdminTeam[] }>(
        `/events/${encodeURIComponent(event.id)}/admin/teams`,
        { cache: "no-store" }
      )
    : null;

  return (
    <AdminShell title="Teams">
      {!event ? (
        <p className="text-sm text-muted-foreground">
          No event found. Check the API is running and migrations have been applied.
        </p>
      ) : result?.data ? (
        <TeamsTable event={event} teams={result.data.teams} totalRiddles={TOTAL_RIDDLES} />
      ) : (
        <p role="alert" className="text-sm text-destructive">
          {result?.error ?? "Couldn't load the teams."}
        </p>
      )}
    </AdminShell>
  );
}
