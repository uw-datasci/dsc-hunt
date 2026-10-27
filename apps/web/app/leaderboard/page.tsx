
import { getCurrentEvent } from "@/lib/event/current";
import { PageShell } from "@/components/shared/page-shell";
import LeaderboardClient from "./leaderboard-client";

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
        <p>No current event is available. Make sure the hunt has started and you're signed in.</p>
      </PageShell>
    );
  }

  return (
    <LeaderboardClient
      eventId={event.id}
      eventName="DSC Hunt"
    />
  );
}
