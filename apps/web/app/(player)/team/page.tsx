import { PageShell } from "@/components/shared/page-shell";
import { TeamSetup } from "@/components/team/team-setup";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  // TODO: load the current user's team (null when they haven't joined one).
  // TODO: if the game is live and they're on a team, redirect to /hunt;
  //       if the game has ended, redirect to /finished.
  const team = null;

  return (
    <PageShell
      width="max-w-3xl"
      eyebrow="DSC Hunt"
      title="Assemble your coven"
      description="Create a new team and share the code, or join one with a code a teammate gave you."
    >
      <TeamSetup initialTeam={team} />
    </PageShell>
  );
}
