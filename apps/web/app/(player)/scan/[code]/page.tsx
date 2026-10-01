import Link from "next/link";
import { Button } from "@dsc-hunt/ui/components/button";
import { Card, CardContent } from "@dsc-hunt/ui/components/card";
import { PageShell } from "@/components/shared/page-shell";

export const dynamic = "force-dynamic";

/**
 * Landing page for the QR code posted at each location. Scanning with a phone
 * camera opens /scan/<code>, which confirms the visit for the player's team.
 *
 * TODO: the (player) layout redirects logged-out scanners to login without a
 * returnTo - pass this path through so they land back here after signing in.
 */
export default async function ScanPage({
  params,
}: Readonly<{ params: Promise<{ code: string }> }>) {
  const { code } = await params;

  // TODO: validate `code` and record the visit for the user's team. Handle:
  //   - unknown / invalid code
  //   - team already scanned this location
  //   - user not on a team (-> /team)
  //   - game not started or already ended
  const locationName = "Location name placeholder";

  return (
    <PageShell eyebrow="Location confirmed" title="You found it!">
      <Card>
        <CardContent className="grid gap-2 text-center">
          <p className="text-5xl" aria-hidden>
            🎃
          </p>
          <p className="text-lg font-semibold">{locationName}</p>
          <p className="text-sm text-muted-foreground">
            Grab your candy from the volunteer, then get back to the riddles.
          </p>
          <p className="font-mono text-xs text-muted-foreground">code: {code}</p>
        </CardContent>
      </Card>
      <Button asChild size="lg">
        <Link href="/hunt">Back to riddles</Link>
      </Button>
    </PageShell>
  );
}
