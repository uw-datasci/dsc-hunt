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
 *
 * TODO: the (player) layout redirects logged-out scanners to login without a
 * returnTo - pass this path through so they land back here after signing in.
 */
export default async function ScanPage({
  params,
}: Readonly<{ params: Promise<{ code: string }> }>) {
  const { code } = await params;
  const { data, error } = await proxyApiJson<ScanResponse>(
    `/events/current/scan/${encodeURIComponent(code)}`,
    { method: "POST" }
  );

  return (
    <PageShell
      eyebrow={data ? "Location confirmed" : "Scan not recorded"}
      title={data ? "You found it!" : "Unable to confirm this scan"}
    >
      {data ? (
        <Card>
          <CardContent className="grid gap-2 text-center">
            <p className="text-5xl" aria-hidden>
              🎃
            </p>
            <p className="text-lg font-semibold">{data.locationName}</p>
            <p className="text-sm text-muted-foreground">
              Grab your candy from the volunteer, then get back to the riddles.
            </p>
          </CardContent>
        </Card>
      ) : (
        <p role="alert" className="text-center text-sm text-destructive">
          {error ?? "The scan could not be confirmed."}
        </p>
      )}
      <Button asChild size="lg" variant={data ? "default" : "outline"}>
        <Link href="/riddles">Back to riddles</Link>
      </Button>
    </PageShell>
  );
}
