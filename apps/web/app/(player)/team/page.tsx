import { PageShell } from "@/components/shared/page-shell";
import { TeamSetup } from "@/components/team/team-setup";
import { getAccessToken } from "@/lib/auth/session";
import { getCurrentEvent } from "@/lib/event/current";
import { getCurrentTeam } from "@/lib/team/session";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const [team, event, accessToken] = await Promise.all([
    getCurrentTeam(),
    getCurrentEvent(),
    getAccessToken(),
  ]);

  return (
    <PageShell
      width="max-w-3xl"
      eyebrow="DSC Hunt"
      title="Assemble your coven"
      description="Create a new team and share the code, or join one with a code a teammate gave you."
    >
      <TeamSetup initialTeam={team} event={event} accessToken={accessToken} />
    </PageShell>
  );
}
