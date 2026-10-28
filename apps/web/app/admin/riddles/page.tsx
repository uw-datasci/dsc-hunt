import Link from "next/link";
import type { AdminRiddle } from "@dsc-hunt/types";
import { Button } from "@dsc-hunt/ui/components/button";
import { AdminShell } from "@/components/admin/admin-shell";
import { RiddlesTable } from "@/components/admin/riddles-table";
import { StartingLocationEditor } from "@/components/admin/starting-location-editor";
import { proxyApiJson } from "@/lib/api/proxy";
import { getCurrentEvent } from "@/lib/event/current";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";

export default async function AdminRiddlesPage() {
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
  const riddles = riddlesResult?.data?.riddles ?? null;

  return (
    <AdminShell
      title="Riddles"
      actions={
        riddles?.some((riddle) => riddle.qrIdentifier) ? (
          <Button asChild variant="outline">
            <Link href="/admin/riddles/print">Print QR codes</Link>
          </Button>
        ) : null
      }
    >
      {event ? (
        <>
          <StartingLocationEditor event={event} />
          {riddles ? (
            <RiddlesTable event={event} riddles={riddles} origin={origin} />
          ) : (
            <p role="alert" className="text-sm text-destructive">
              {riddlesResult?.error ?? "Couldn't load the riddles."}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No event found. Check the API is running and migrations have been applied.
        </p>
      )}
    </AdminShell>
  );
}
