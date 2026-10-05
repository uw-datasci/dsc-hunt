"use client";

import { useState } from "react";
import type { LeaderboardEntry } from "@dsc-hunt/types";
import { Card, CardContent } from "@dsc-hunt/ui/components/card";
import { cn } from "@dsc-hunt/ui/lib/utils";
import { PageShell } from "@/components/shared/page-shell";

// TODO: replace with GET /events/:id/leaderboard for the current event.
const dummyEvent = { id: "dummy-event", name: "DSC Hunt" };
const dummyTeamId = "team-alpha";

const dummyLeaderboard: LeaderboardEntry[] = [
  { rank: 1, teamId: "team-alpha", name: "Team Alpha", totalScore: 325 },
  { rank: 2, teamId: "team-bravo", name: "Team Bravo", totalScore: 250 },
  { rank: 3, teamId: "team-charlie", name: "Team Charlie", totalScore: 175 },
  { rank: 4, teamId: "team-delta", name: "Team Delta", totalScore: 100 },
];

export default function LeaderboardPage() {
  const [leaderboard] = useState<LeaderboardEntry[]>(dummyLeaderboard);
  const event = dummyEvent;

  /*
  // Realtime leaderboard stream
  useEffect(() => {
    if (!event?.id) return;

    const source = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${encodeURIComponent(
        event.id
      )}/leaderboard/stream`
    );

    source.onmessage = (message) => {
      const data = JSON.parse(message.data) as {
        eventId: string;
        data: LeaderboardEntry[];
      };

      setLeaderboard(data.data);
    };

    source.onerror = () => {
      console.error("Leaderboard stream disconnected.");
    };

    return () => {
      source.close();
    };
  }, [event?.id]);
  */

  return (
    <PageShell
      width="max-w-2xl"
      eyebrow={event.name}
      title="Leaderboard"
      description="Highest score wins. Ties go to the team that got there first."
    >
      <ol className="grid gap-3">
        {leaderboard.map((entry) => (
          <li key={entry.teamId}>
            <Card
              size="sm"
              className={cn(entry.teamId === dummyTeamId && "ring-2 ring-primary")}
            >
              <CardContent className="flex items-center gap-4">
                <span className="w-8 font-heading text-2xl text-primary">{entry.rank}</span>
                <p className="flex-1 font-medium">{entry.name}</p>
                <span className="font-semibold tabular-nums">{entry.totalScore}</span>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
