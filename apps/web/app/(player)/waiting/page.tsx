import Link from "next/link";
import { Card, CardContent } from "@dsc-hunt/ui/components/card";
import { PageShell } from "@/components/shared/page-shell";

export const dynamic = "force-dynamic";

export default async function WaitingPage() {
  // TODO: load the user's team + game status.
  //   - no team        -> redirect("/team")
  //   - game live      -> redirect("/hunt")
  //   - game ended     -> redirect("/finished")
  // TODO: subscribe to game status (realtime or polling) so players are
  //       pushed to /hunt the moment an admin starts the game.
  const teamName = "The Pumpkin Patch";
  const startingLocation = "Starting location TBA";

  return (
    <PageShell
      eyebrow={teamName}
      title="The hunt awaits…"
      description="Hang tight. Your riddles will appear here as soon as the hunt begins."
    >
      <Card>
        <CardContent className="grid gap-4 text-center">
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Meet at</p>
            {/* TODO: show the team's assigned starting location. */}
            <p className="mt-1 text-lg font-semibold">{startingLocation}</p>
          </div>
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Starts in</p>
            {/* TODO: live countdown if the admin schedules a start time. */}
            <p className="mt-1 font-mono text-3xl text-primary tabular-nums">--:--</p>
          </div>
        </CardContent>
      </Card>
      <Link
        href="/team"
        className="text-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to team
      </Link>
    </PageShell>
  );
}
