"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { AdminTeam, Event, TeamMember } from "@dsc-hunt/types";
import { Button } from "@dsc-hunt/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@dsc-hunt/ui/components/dialog";
import { Input } from "@dsc-hunt/ui/components/input";
import { Label } from "@dsc-hunt/ui/components/label";
import { apiErrorMessage } from "@/lib/api/error-message";

interface TeamManageDialogProps {
  readonly event: Event;
  readonly team: AdminTeam;
  readonly onClose: () => void;
  /** Reload the page data after a change. */
  readonly onChanged: () => void;
}

type Busy = "rename" | "delete" | `remove:${string}` | null;

/** Members, rename, remove a player, delete the team. */
export function TeamManageDialog({ event, team, onClose, onChanged }: TeamManageDialogProps) {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState(team.name);
  const [busy, setBusy] = useState<Busy>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const base = `/api/admin/events/${encodeURIComponent(event.id)}/teams/${encodeURIComponent(team.id)}`;
  const canDelete = event.status === "not_started";

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/teams/${encodeURIComponent(team.id)}`)
      .then(async (response) => {
        if (!response.ok)
          throw new Error(await apiErrorMessage(response, "Couldn't load members"));
        return (await response.json()) as { members: TeamMember[] };
      })
      .then((body) => !cancelled && setMembers(body.members))
      .catch((err: Error) => !cancelled && setLoadError(err.message));
    return () => {
      cancelled = true;
    };
  }, [team.id]);

  async function run(kind: Busy, request: () => Promise<Response>, success: string) {
    setBusy(kind);
    try {
      const response = await request();
      if (!response.ok) {
        toast.error(await apiErrorMessage(response, "Something went wrong"));
        return false;
      }
      toast.success(success);
      onChanged();
      return true;
    } catch {
      toast.error("Network error. Please try again.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function rename(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === team.name) return;
    await run(
      "rename",
      () =>
        fetch(base, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        }),
      `Renamed to ${trimmed}`
    );
  }

  async function removeMember(member: TeamMember) {
    const ok = await run(
      `remove:${member.userId}`,
      () => fetch(`${base}/members/${encodeURIComponent(member.userId)}`, { method: "DELETE" }),
      `Removed ${member.displayName}`
    );
    if (!ok) return;
    setConfirmRemove(null);
    const remaining = members?.filter((m) => m.userId !== member.userId) ?? [];
    setMembers(remaining);
    // Before the start, removing the last player deletes the team.
    if (remaining.length === 0 && canDelete) onClose();
  }

  async function deleteTeam() {
    const ok = await run(
      "delete",
      () => fetch(base, { method: "DELETE" }),
      `Deleted ${team.name}`
    );
    if (ok) onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && busy === null && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{team.name}</DialogTitle>
          <DialogDescription>
            Code <span className="font-mono">{team.code}</span> · {team.found} found ·{" "}
            {team.totalScore} points
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-2" onSubmit={rename}>
          <Label htmlFor="team-rename">Team name</Label>
          <div className="flex gap-2">
            <Input
              id="team-rename"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
            <Button
              type="submit"
              variant="outline"
              disabled={busy !== null || !name.trim() || name.trim() === team.name}
            >
              {busy === "rename" ? "Saving…" : "Rename"}
            </Button>
          </div>
        </form>

        <div className="grid gap-2">
          <p className="text-sm font-medium">
            Members ({members?.length ?? team.memberCount} / {event.teamSizeCap})
          </p>
          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : members === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members.</p>
          ) : (
            <ul className="grid gap-1">
              {members.map((member) => (
                <li
                  key={member.userId}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span>{member.displayName}</span>
                  {confirmRemove === member.userId ? (
                    <span className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busy !== null}
                        onClick={() => void removeMember(member)}
                      >
                        {busy === `remove:${member.userId}` ? "Removing…" : "Confirm"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy !== null}
                        onClick={() => setConfirmRemove(null)}
                      >
                        Cancel
                      </Button>
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy !== null}
                      onClick={() => setConfirmRemove(member.userId)}
                    >
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!canDelete ? (
            <p className="text-xs text-muted-foreground">
              The hunt has started: an emptied team keeps its scans and score.
            </p>
          ) : null}
        </div>

        <div className="grid gap-2 border-t pt-4">
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-destructive">
                Delete {team.name} and remove all its members?
              </p>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy !== null}
                onClick={() => void deleteTeam()}
              >
                {busy === "delete" ? "Deleting…" : "Delete team"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy !== null}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="justify-self-start text-destructive"
              disabled={!canDelete || busy !== null}
              onClick={() => setConfirmDelete(true)}
            >
              Delete team
            </Button>
          )}
          {!canDelete ? (
            <p className="text-xs text-muted-foreground">
              Teams can only be deleted before the hunt starts.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
