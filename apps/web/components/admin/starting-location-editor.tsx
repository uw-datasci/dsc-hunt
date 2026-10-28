"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Event } from "@dsc-hunt/types";
import { Button } from "@dsc-hunt/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@dsc-hunt/ui/components/dialog";
import { Input } from "@dsc-hunt/ui/components/input";
import { Label } from "@dsc-hunt/ui/components/label";
import { Textarea } from "@dsc-hunt/ui/components/textarea";
import { apiErrorMessage } from "@/lib/api/error-message";

interface StartingLocationEditorProps {
  readonly event: Event;
}

/**
 * The venue where the event is held and the hunt is introduced. Players see
 * it before the start; it can only be edited until then.
 */
export function StartingLocationEditor({ event }: StartingLocationEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(event.startingLocationName ?? "");
  const [details, setDetails] = useState(event.startingLocationDetails ?? "");
  const [saving, setSaving] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const locked = event.status !== "not_started";

  function openEditor() {
    setName(event.startingLocationName ?? "");
    setDetails(event.startingLocationDetails ?? "");
    setOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/events/${encodeURIComponent(event.id)}/starting-location`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, details: details.trim() ? details : null }),
        }
      );
      if (!response.ok) {
        toast.error(await apiErrorMessage(response, "Couldn't save the starting location"));
        return;
      }
      setOpen(false);
      toast.success(name.trim() ? "Starting location saved" : "Starting location cleared");
      startRefresh(() => router.refresh());
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-card p-4">
      <div className="min-w-0">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          Starting location (event venue)
        </p>
        {event.startingLocationName ? (
          <>
            <p className="mt-1 font-medium">{event.startingLocationName}</p>
            {event.startingLocationDetails ? (
              <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                {event.startingLocationDetails}
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Not set</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={locked || refreshing}
          onClick={openEditor}
        >
          Edit
        </Button>
        {locked ? (
          <p className="text-xs text-muted-foreground">Locked once the hunt starts</p>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <DialogContent>
          <form className="grid gap-4" onSubmit={save}>
            <DialogHeader>
              <DialogTitle>Starting location</DialogTitle>
              <DialogDescription>
                Where the event is held and the hunt is introduced. Players see it before the
                hunt starts. Leave the name blank to clear it.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="starting-location-name">Venue</Label>
              <Input
                id="starting-location-name"
                placeholder="MC Atrium"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="starting-location-details">
                Details <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="starting-location-details"
                placeholder="By the pumpkin table, kickoff at 6:45pm"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
                disabled={!name.trim()}
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
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
