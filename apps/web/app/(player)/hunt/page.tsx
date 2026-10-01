import { Badge } from "@dsc-hunt/ui/components/badge";
import { Card, CardContent } from "@dsc-hunt/ui/components/card";
import { cn } from "@dsc-hunt/ui/lib/utils";
import { PageShell } from "@/components/shared/page-shell";

export const dynamic = "force-dynamic";

// TODO: replace with real data (the team's riddles + which ones they've scanned).
const PLACEHOLDER_RIDDLES = [
  {
    id: "1",
    text: "I hold a thousand stories but never speak. Find me where silence is kept.",
    found: true,
  },
  {
    id: "2",
    text: "Where caffeine flows and deadlines grow, students gather row by row.",
    found: true,
  },
  { id: "3", text: "I tick but have no clock, I tower over the quad.", found: false },
  { id: "4", text: "Geese guard my waters; cross my bridge if you dare.", found: false },
  { id: "5", text: "Riddle text placeholder.", found: false },
];

export default async function HuntPage() {
  // TODO: load the user's team + game status.
  //   - no team        -> redirect("/team")
  //   - not started    -> redirect("/waiting")
  //   - game ended     -> redirect("/finished")
  // TODO: refresh progress when a teammate scans a location (realtime).
  const teamName = "The Pumpkin Patch";
  const foundCount = PLACEHOLDER_RIDDLES.filter((riddle) => riddle.found).length;

  return (
    <PageShell
      width="max-w-2xl"
      eyebrow={teamName}
      title="Your riddles"
      description={`${foundCount} / ${PLACEHOLDER_RIDDLES.length} locations found`}
    >
      <ol className="grid gap-3">
        {PLACEHOLDER_RIDDLES.map((riddle, index) => (
          <li key={riddle.id}>
            <Card size="sm" className={cn(riddle.found && "opacity-70")}>
              <CardContent className="flex items-start gap-4">
                <span className="font-heading text-2xl text-primary">{index + 1}</span>
                <p className="flex-1 text-sm">{riddle.text}</p>
                {riddle.found ? (
                  <Badge className="bg-accent text-accent-foreground">Found</Badge>
                ) : (
                  <Badge variant="outline">Unfound</Badge>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
      <p className="text-center text-sm text-muted-foreground">
        🎃 Solved one? Head there, grab your candy from the volunteer, and scan the QR code to
        confirm your visit.
      </p>
      {/* TODO: optional in-app QR scanner button (camera) as an alternative to the phone camera. */}
    </PageShell>
  );
}
