import Link from "next/link";
import { Button } from "@dsc-hunt/ui/components/button";
import { Card, CardContent } from "@dsc-hunt/ui/components/card";
import { PageShell } from "@/components/shared/page-shell";
import { proxyApiJson } from "@/lib/api/proxy";
import type { ScanResponse } from "@dsc-hunt/types";

export const dynamic = "force-dynamic";

/**
 * Landing page for the QR code posted at each location. Scanning with a phone
 * camera opens /scan/<code>, which confirms the visit for the player's team.
 * Logged-out scanners come back here after login (see the (player) layout).
 */
export default async function ScanPage({
  params,
}: Readonly<{ params: Promise<{ code: string }> }>) {
  const { code } = await params;
  const { data, error } = await proxyApiJson<ScanResponse>(
    `/events/current/scan/${encodeURIComponent(code)}`,
    { method: "POST" }
  );

  if (!data) {
    return (
      <PageShell eyebrow="Scan not recorded" title="Unable to confirm this scan">
        <p role="alert" className="text-center text-sm text-destructive">
          {error ?? "The scan could not be confirmed."}
        </p>
        <Button asChild size="lg" variant="outline">
          <Link href="/riddles">Back to riddles</Link>
        </Button>
      </PageShell>
    );
  }

  const pointsLabel = `${data.points} ${data.points === 1 ? "point" : "points"}`;

  return (
    <PageShell
      eyebrow={data.alreadyScanned ? "Already found" : "Location confirmed"}
      title={data.alreadyScanned ? "Your team already found this" : "You found it!"}
    >
      <Card>
        <CardContent className="grid gap-2 text-center">
          <p className="text-5xl" aria-hidden>
            {data.alreadyScanned ? "👻" : "🎃"}
          </p>
          <p className="text-lg font-semibold">{data.locationName}</p>
          {data.alreadyScanned ? (
            <p className="text-sm text-muted-foreground">You earned {pointsLabel} here.</p>
          ) : (
            <>
              <p className="font-heading text-4xl text-primary tabular-nums">+{pointsLabel}</p>
              <p className="text-sm text-muted-foreground">
                Team total: <span className="tabular-nums">{data.totalScore}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Grab your candy from the volunteer, then get back to the riddles.
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Button asChild size="lg">
        <Link href="/riddles">Back to riddles</Link>
      </Button>
    </PageShell>
  );
}
