"use client";

import { useState } from "react";
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

// TODO: move to @dsc-hunt/types once the game model is defined.
export type GameStatus = "not_started" | "live" | "ended";

const STATUS_LABEL: Record<GameStatus, string> = {
  not_started: "Not started",
  live: "Live",
  ended: "Ended",
};

interface GameControlsProps {
  readonly initialStatus: GameStatus;
}

/**
 * Status badge + Start / End buttons with confirm dialogs. Status is local
 * state for now so the flow can be clicked through.
 */
export function GameControls({ initialStatus }: GameControlsProps) {
  const [status, setStatus] = useState(initialStatus);
  const [dialog, setDialog] = useState<"start" | "end" | null>(null);
  const [setupConfirmed, setSetupConfirmed] = useState(false);

  function openStart() {
    setSetupConfirmed(false);
    setDialog("start");
  }

  function confirmStart() {
    // TODO: call the start-game endpoint (optionally with a scheduled start
    // time), then router.refresh(). Players on /waiting should be pushed to
    // /hunt via realtime.
    setStatus("live");
    setDialog(null);
  }

  function confirmEnd() {
    // TODO: call the end-game endpoint, then router.refresh(). Players should
    // be pushed to /finished and further scans rejected.
    setStatus("ended");
    setDialog(null);
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
        <Button variant="destructive" onClick={() => setDialog("end")}>
          End hunt
        </Button>
      ) : null}
      {/* TODO: decide whether an ended hunt can be reset/archived from here. */}

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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={confirmStart} disabled={!setupConfirmed}>
              Start hunt
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmEnd}>
              End hunt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
