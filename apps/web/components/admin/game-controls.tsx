"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import type { Event, EventStatus } from "@dsc-hunt/types";
import { Badge } from "@dsc-hunt/ui/components/badge";
import { Button } from "@dsc-hunt/ui/components/button";
import { Checkbox } from "@dsc-hunt/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@dsc-hunt/ui/components/dialog";
import { cn } from "@dsc-hunt/ui/lib/utils";
import { useAdminLive } from "@/components/admin/admin-live";

const STATUS_LABEL: Record<EventStatus, string> = {
  not_started: "Not started",
  live: "Live",
  ended: "Ended",
};

function ChecklistItem({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <Check className="h-4 w-4 text-emerald-500" aria-label="Done" />
      ) : (
        <X className="h-4 w-4 text-destructive" aria-label="Not done" />
      )}
      <span className={cn(!ok && "text-muted-foreground")}>{children}</span>
    </li>
  );
}

/**
 * Status badge + Start / End buttons with confirm dialogs. Start and End call
 * the API through /api/admin/events/:id/{start,end}. Status and the start
 * checklist come from the shared admin stream (`AdminLiveProvider`), so a
 * change made by another admin, a new team or a riddle edit shows up live.
 */
export function GameControls() {
  const router = useRouter();
  const { event, status, stats, setStatus } = useAdminLive();
  const [dialog, setDialog] = useState<"start" | "end" | null>(null);
  const [setupConfirmed, setSetupConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blockers = stats?.startBlockers ?? [];
  const canStart = stats !== null && blockers.length === 0 && setupConfirmed;

  function openStart() {
    setSetupConfirmed(false);
    setError(null);
    setDialog("start");
  }

  function openEnd() {
    setError(null);
    setDialog("end");
  }

  async function transition(action: "start" | "end") {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/${encodeURIComponent(event.id)}/${action}`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as {
        event?: Event;
        error?: string;
      };
      if (!res.ok || !body.event) {
        throw new Error(body.error ?? `Failed to ${action} the hunt`);
      }
      setStatus(body.event.status);
      setDialog(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} the hunt`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge
        variant={status === "live" ? "default" : "outline"}
        className={status === "live" ? "bg-accent text-accent-foreground" : undefined}
      >
        {STATUS_LABEL[status]}
      </Badge>

      {status === "not_started" ? <Button onClick={openStart}>Start hunt</Button> : null}
      {status === "live" ? (
        <Button variant="destructive" onClick={openEnd}>
          End hunt
        </Button>
      ) : null}

      <Dialog
        open={dialog === "start"}
        onOpenChange={(open) => setDialog(open ? "start" : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start the hunt?</DialogTitle>
            <DialogDescription>
              Every team will see their riddles immediately and QR scans will start counting.
              Riddles and the starting location lock once it starts.
            </DialogDescription>
          </DialogHeader>

          {stats ? (
            <ul className="grid gap-2">
              <ChecklistItem ok={stats.configuredRiddles === stats.totalRiddles}>
                All {stats.totalRiddles} riddles set up ({stats.configuredRiddles}/
                {stats.totalRiddles})
              </ChecklistItem>
              <ChecklistItem ok={stats.startingLocationSet}>
                Starting location set
              </ChecklistItem>
              <ChecklistItem ok={stats.teamCount > 0}>
                At least one team registered ({stats.teamCount})
              </ChecklistItem>
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Checking readiness…</p>
          )}
          {blockers.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Fix these on the{" "}
              <Link href="/admin/riddles" className="underline underline-offset-4">
                Riddles page
              </Link>
              , or wait for teams to join.
            </p>
          ) : null}

          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={setupConfirmed}
              onCheckedChange={(checked) => setSetupConfirmed(checked === true)}
            />
            QR codes are posted and volunteers are in place.
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={() => void transition("start")} disabled={!canStart || pending}>
              {pending ? "Starting…" : "Start hunt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "end"} onOpenChange={(open) => setDialog(open ? "end" : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End the hunt?</DialogTitle>
            <DialogDescription>
              Scans will stop counting and every player is sent to the results screen. This
              can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void transition("end")}
              disabled={pending}
            >
              {pending ? "Ending…" : "End hunt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
