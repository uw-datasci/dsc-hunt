import Link from "next/link";
import { Button } from "@dsc-hunt/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@dsc-hunt/ui/components/card";
import type { PlaceholderTeam } from "@/components/team/placeholder-team";

interface TeamLobbyProps {
  readonly team: PlaceholderTeam;
  readonly onLeave: () => void;
}

export function TeamLobby({ team, onLeave }: TeamLobbyProps) {
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

        <div className="flex flex-wrap gap-2">
          {/* TODO: route to /hunt instead once the game is live. */}
          <Button asChild className="flex-1">
            <Link href="/waiting">Ready up</Link>
          </Button>
          {/* TODO: call the leave-team endpoint; decide what happens to an emptied team. */}
          <Button variant="outline" onClick={onLeave}>
            Leave team
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
