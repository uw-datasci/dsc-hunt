import { PageShell } from "@/components/shared/page-shell";
import { TeamSetup } from "@/components/team/team-setup";
import { getEventStatus } from "@/lib/event/store";
import { getCurrentTeam } from "@/lib/team/session";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const team = await getCurrentTeam();
  const status = getEventStatus();

  return (
    <PageShell
      width="max-w-3xl"
      eyebrow="DSC Hunt"
      title="Assemble your coven"
      description="Create a new team and share the code, or join one with a code a teammate gave you."
    >
      <TeamSetup initialTeam={team} initialStatus={status} />
    </PageShell>
  );
}
