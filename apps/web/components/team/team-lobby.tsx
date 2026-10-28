"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Event, EventStatus, TeamWithMembers } from "@dsc-hunt/types";
import { Button } from "@dsc-hunt/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@dsc-hunt/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@dsc-hunt/ui/components/dialog";
import { useEventStream, type TeamMembersMessage } from "@/hooks/use-event-stream";
import { apiErrorMessage } from "@/lib/api/error-message";

const STATUS_HELPER: Partial<Record<EventStatus, string>> = {
  not_started: "Hunt hasn't started yet",
  ended: "Hunt has ended",
};

interface TeamLobbyProps {
  readonly team: TeamWithMembers;
  readonly event: Event | null;
  readonly accessToken: string | null;
  /** Signed-in player; if a roster update leaves them out, an admin removed them. */
  readonly userId: string | null;
}

export function TeamLobby({ team, event, accessToken, userId }: TeamLobbyProps) {
  const router = useRouter();
  const [members, setMembers] = useState(team.members);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const connectedOnce = useRef(false);

  // The server re-sends the roster after router.refresh(); adopt it over the
  // live copy (React's "adjust state when a prop changes" pattern).
  const [rosterFromServer, setRosterFromServer] = useState(team.members);
  if (rosterFromServer !== team.members) {
    setRosterFromServer(team.members);
    setMembers(team.members);
  }

  const onTeamMembers = useCallback(
    (msg: TeamMembersMessage) => {
      // Players who leave stop getting team messages first, so a roster without
      // us means an admin removed us (or deleted the team).
      if (userId && !msg.members.some((member) => member.userId === userId)) {
        toast.info(`You were removed from ${team.name}`);
        startRefresh(() => router.refresh());
        return;
      }
      setMembers(msg.members);
    },
    [userId, team.name, router]
  );

  // The server sends a status snapshot on every (re)connect. Refresh on
  // reconnects so roster changes missed while offline show up.
  const onEventStatus = useCallback(() => {
    if (connectedOnce.current) startRefresh(() => router.refresh());
    connectedOnce.current = true;
  }, [router]);

  const status =
    useEventStream({
      eventId: event?.id ?? null,
      accessToken,
      initialStatus: event?.status ?? "not_started",
      teamId: team.id,
      onTeamMembers,
      onEventStatus,
    }) ?? "not_started";
  const isLive = status === "live";
  // The API only allows leaving before the hunt starts.
  const canLeave = status === "not_started";
  const isLastMember = members.length <= 1;

  async function leave() {
    setLeaving(true);
    try {
      const response = await fetch(`/api/teams/${encodeURIComponent(team.id)}/members/me`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error(await apiErrorMessage(response, "Couldn't leave the team"));
        return;
      }
      setLeaveOpen(false);
      toast.success(`You left ${team.name}`);
      startRefresh(() => router.refresh());
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLeaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{team.name}</CardTitle>
        <CardDescription>Share this code so your teammates can join.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <p className="rounded-lg border border-dashed py-4 text-center font-mono text-3xl tracking-[0.4em] text-primary tabular-nums">
          {team.code}
        </p>

        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Members ({members.length}
            {event ? ` / ${event.teamSizeCap}` : ""})
          </p>
          <ul className="mt-2 grid gap-1 text-sm">
            {members.map((member) => (
              <li key={member.userId}>👻 {member.displayName}</li>
            ))}
          </ul>
        </div>

        <div className="grid gap-2">
          {isLive ? (
            <Button asChild>
              <Link href="/riddles">Click here to see riddles</Link>
            </Button>
          ) : (
            <Button disabled>Click here to see riddles</Button>
          )}
          {STATUS_HELPER[status] ? (
            <p className="text-center text-sm text-muted-foreground">{STATUS_HELPER[status]}</p>
          ) : null}
          <Button asChild variant="ghost">
            <Link href="/leaderboard">View the leaderboard</Link>
          </Button>
          {canLeave ? (
            <Button variant="outline" disabled={refreshing} onClick={() => setLeaveOpen(true)}>
              Leave team
            </Button>
          ) : null}
        </div>
      </CardContent>

      <Dialog open={leaveOpen} onOpenChange={(open) => !leaving && setLeaveOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave {team.name}?</DialogTitle>
            <DialogDescription>
              {isLastMember
                ? "You're the last member, so the team and its code will be deleted."
                : "You can rejoin with the code as long as the team isn't full."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={leaving} onClick={() => setLeaveOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={leaving} onClick={() => void leave()}>
              {leaving ? "Leaving…" : "Leave team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
