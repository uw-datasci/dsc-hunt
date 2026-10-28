import type { LeaderboardEntry } from "@dsc-hunt/types";
import { PageShell } from "@/components/shared/page-shell";
import { proxyApiJson } from "@/lib/api/proxy";
import { getAccessToken } from "@/lib/auth/session";
import { getCurrentEvent } from "@/lib/event/current";
import LeaderboardClient from "./leaderboard-client";

export const dynamic = "force-dynamic";

/**
 * Public: projected at home base and viewed on phones, so it works logged
 * out. The board is loaded here and kept live by the client.
 */
export default async function LeaderboardPage() {
  const event = await getCurrentEvent();

  if (!event) {
    return (
      <PageShell
        width="max-w-2xl"
        eyebrow="DSC Hunt"
        title="Leaderboard"
        description="Highest score wins. Ties go to the team that got there first."
      >
        <p className="text-center text-sm text-muted-foreground">
          No hunt has been set up yet. Check back soon.
        </p>
      </PageShell>
    );
  }

  const [{ data }, accessToken] = await Promise.all([
    proxyApiJson<{ leaderboard: LeaderboardEntry[] }>(
      `/events/${encodeURIComponent(event.id)}/leaderboard`,
      { cache: "no-store" }
    ),
    getAccessToken(),
  ]);

  return (
    <LeaderboardClient
      event={event}
      initialEntries={data?.leaderboard ?? null}
      accessToken={accessToken}
    />
  );
}
