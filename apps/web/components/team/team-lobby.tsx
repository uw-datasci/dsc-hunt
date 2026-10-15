import Link from "next/link";
import { Button } from "@dsc-hunt/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@dsc-hunt/ui/components/card";
import type { Event, EventStatus } from "@dsc-hunt/types";
import type { PlaceholderTeam } from "@/components/team/placeholder-team";
import { useEventStream } from "@/hooks/use-event-stream";

const STATUS_HELPER: Partial<Record<EventStatus, string>> = {
  not_started: "Hunt hasn't started yet",
  ended: "Hunt has ended",
};

interface TeamLobbyProps {
  readonly team: PlaceholderTeam;
  readonly event: Event | null;
  readonly accessToken: string | null;
  readonly onLeave: () => void;
}

export function TeamLobby({ team, event, accessToken, onLeave }: TeamLobbyProps) {
  const status =
    useEventStream({
      eventId: event?.id ?? null,
      accessToken,
      initialStatus: event?.status ?? "not_started",
    }) ?? "not_started";
  const isLive = status === "live";

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
            Members ({team.members.length})
          </p>
          {/* TODO: load real members; live-update as teammates join/leave. */}
          <ul className="mt-2 grid gap-1 text-sm">
            {team.members.map((member) => (
              <li key={member}>👻 {member}</li>
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
          {/* TODO: call the leave-team endpoint; decide what happens to an emptied team. */}
          <Button variant="outline" onClick={onLeave}>
            Leave team
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
