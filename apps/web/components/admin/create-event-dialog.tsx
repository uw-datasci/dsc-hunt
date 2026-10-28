"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@dsc-hunt/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@dsc-hunt/ui/components/dialog";
import { Input } from "@dsc-hunt/ui/components/input";
import { Label } from "@dsc-hunt/ui/components/label";
import { apiErrorMessage } from "@/lib/api/error-message";

const DEFAULT_TEAM_SIZE_CAP = 4;

interface CreateEventDialogProps {
  readonly triggerLabel?: string;
}

/**
 * Staff-only flow to start a new hunt after the previous one has ended (or when
 * no event exists yet).
 */
export function CreateEventDialog({ triggerLabel = "New event" }: CreateEventDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [teamSizeCap, setTeamSizeCap] = useState(String(DEFAULT_TEAM_SIZE_CAP));
  const [saving, setSaving] = useState(false);
  const [, startRefresh] = useTransition();

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Event name is required");
      return;
    }
    const cap = Number.parseInt(teamSizeCap, 10);
    if (!Number.isFinite(cap) || cap < 1 || cap > 20) {
      toast.error("Team size cap must be between 1 and 20");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, teamSizeCap: cap }),
      });
      if (!response.ok) {
        toast.error(await apiErrorMessage(response, "Couldn't create the event"));
        return;
      }
      setOpen(false);
      toast.success("Event created");
      startRefresh(() => router.refresh());
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (saving) return;
        if (next) {
          setName("");
          setTeamSizeCap(String(DEFAULT_TEAM_SIZE_CAP));
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <form className="grid gap-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New event</DialogTitle>
            <DialogDescription>
              Sets up a fresh hunt. Players and admins will use this event once it
              becomes the newest in the system. Configure riddles, teams, and the
              starting location before you start.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="create-event-name">Name</Label>
            <Input
              id="create-event-name"
              placeholder="DSC Hunt Fall 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-event-team-size-cap">Team size cap</Label>
            <Input
              id="create-event-team-size-cap"
              type="number"
              min={1}
              max={20}
              value={teamSizeCap}
              onChange={(e) => setTeamSizeCap(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
