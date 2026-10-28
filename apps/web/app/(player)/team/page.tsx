import { StartingLocationCard } from "@/components/event/starting-location-card";
import { PageShell } from "@/components/shared/page-shell";
import { TeamSetup } from "@/components/team/team-setup";
import { getAccessToken } from "@/lib/auth/session";
import { getCurrentEvent } from "@/lib/event/current";
import { getCurrentTeam } from "@/lib/team/current";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const event = await getCurrentEvent();
  const [team, accessToken] = await Promise.all([getCurrentTeam(event), getAccessToken()]);

  return (
    <PageShell
      width="max-w-3xl"
      eyebrow="DSC Hunt"
      title="Assemble your coven"
      description="Create a new team and share the code, or join one with a code a teammate gave you."
    >
      <StartingLocationCard event={event} />
      <TeamSetup team={team} event={event} accessToken={accessToken} />
    </PageShell>
  );
}
