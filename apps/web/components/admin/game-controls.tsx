"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
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
import { useEventStream, type EventStatusMessage } from "@/hooks/use-event-stream";

const STATUS_LABEL: Record<EventStatus, string> = {
  not_started: "Not started",
  live: "Live",
  ended: "Ended",
};

interface GameControlsProps {
  readonly event: Event;
  readonly accessToken: string | null;
}

/**
 * Status badge + Start / End buttons with confirm dialogs. Start and End call
 * the API through /api/admin/events/:id/{start,end}; the badge also follows
 * the event stream so a change made by another admin shows up live.
 */
export function GameControls({ event, accessToken }: GameControlsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<EventStatus>(event.status);
  const [dialog, setDialog] = useState<"start" | "end" | null>(null);
  const [setupConfirmed, setSetupConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onEventStatus = useCallback((msg: EventStatusMessage) => setStatus(msg.status), []);
  useEventStream({
    eventId: event.id,
    accessToken,
    initialStatus: event.status,
    onEventStatus,
  });

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

  function confirmStart() {
    void transition("start");
  }

  function confirmEnd() {
    void transition("end");
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
            </DialogDescription>
          </DialogHeader>
          {/* TODO: show a checklist summary (riddle count, teams registered, volunteers in place). */}
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={setupConfirmed}
              onCheckedChange={(checked) => setSetupConfirmed(checked === true)}
            />
            Riddles are final and every QR code + volunteer is in place.
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={confirmStart} disabled={!setupConfirmed || pending}>
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
            <Button variant="destructive" onClick={confirmEnd} disabled={pending}>
              {pending ? "Ending…" : "End hunt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
