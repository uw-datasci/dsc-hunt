import Link from "next/link";
import type { AdminRiddle } from "@dsc-hunt/types";
import { PrintSheet } from "@/components/admin/print-sheet";
import { proxyApiJson } from "@/lib/api/proxy";
import { getCurrentEvent } from "@/lib/event/current";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

/**
 * Print-friendly QR codes: one location per printed page. Staff only (the
 * admin layout guards it). No admin chrome, so it prints cleanly.
 */
export default async function PrintQrCodesPage() {
  const event = await getCurrentEvent();
  const [riddlesResult, origin] = await Promise.all([
    event
      ? proxyApiJson<{ riddles: AdminRiddle[] }>(
          `/events/${encodeURIComponent(event.id)}/admin/riddles`,
          { cache: "no-store" }
        )
      : null,
    getRequestOrigin(),
  ]);
  const codes = (riddlesResult?.data?.riddles ?? []).flatMap((riddle) =>
    riddle.qrIdentifier && riddle.locationName
      ? [
          {
            position: riddle.position,
            locationName: riddle.locationName,
            url: `${origin}/scan/${encodeURIComponent(riddle.qrIdentifier)}`,
          },
        ]
      : []
  );

  if (codes.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center text-sm text-muted-foreground">
        <p>No QR codes yet. Save a riddle first.</p>
        <Link href="/admin/riddles" className="mt-4 inline-block underline underline-offset-4">
          ← Back to riddles
        </Link>
      </main>
    );
  }

  return <PrintSheet eventName={event?.name ?? "DSC Hunt"} codes={codes} />;
}
