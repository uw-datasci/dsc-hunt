import Link from "next/link";
import { Card, CardContent } from "@dsc-hunt/ui/components/card";
import { PageShell } from "@/components/shared/page-shell";

export const dynamic = "force-dynamic";

export default async function FinishedPage() {
  // TODO: if the game hasn't ended yet, redirect to /hunt or /waiting.
  // TODO: load the team's final result.
  const teamName = "The Pumpkin Patch";
  const foundCount = 0;
  const totalCount = 0;

  return (
    <PageShell
      eyebrow={teamName}
      title="The hunt is over"
      description="Thanks for playing! Enjoy your candy. 🍬"
    >
      <Card>
        <CardContent className="text-center">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Locations found
          </p>
          <p className="mt-1 font-heading text-5xl text-primary tabular-nums">
            {foundCount} / {totalCount}
          </p>
        </CardContent>
      </Card>
      {/* TODO: decide whether to show final standings / a leaderboard here. */}
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Final standings placeholder
      </div>
      <Link
        href="/"
        className="text-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to home
      </Link>
    </PageShell>
  );
}
