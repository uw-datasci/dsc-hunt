"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Event, LeaderboardEntry } from "@dsc-hunt/types";
import { Card, CardContent } from "@dsc-hunt/ui/components/card";
import { PageShell } from "@/components/shared/page-shell";
import { clientConfig } from "@/config/client";
import { useEventStream, type ScoreUpdateMessage } from "@/hooks/use-event-stream";

interface LeaderboardClientProps {
  readonly event: Event;
  /** Server-loaded board; null if that request failed (the client retries). */
  readonly initialEntries: LeaderboardEntry[] | null;
  /** Present when signed in; the stream also works without it. */
  readonly accessToken: string | null;
}

/** Earlier score time wins a tie; teams that haven't scored go last. */
function compareScoredAt(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return Date.parse(a) - Date.parse(b);
}

/** Same order as the API: score desc, then first to score, then name. Re-ranks. */
function rankEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries]
    .sort(
      (a, b) =>
        b.totalScore - a.totalScore ||
        compareScoredAt(a.lastScoredAt, b.lastScoredAt) ||
        a.name.localeCompare(b.name)
    )
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export default function LeaderboardClient({
  event,
  initialEntries,
  accessToken,
}: LeaderboardClientProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(initialEntries);
  const entriesRef = useRef(entries);
  const connectedOnce = useRef(false);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  const refetch = useCallback(async () => {
    try {
      const response = await fetch(
        `${clientConfig.apiUrl}/events/${encodeURIComponent(event.id)}/leaderboard`,
        { cache: "no-store" }
      );
      if (!response.ok) return;
      const result = (await response.json()) as { leaderboard: LeaderboardEntry[] };
      setEntries(rankEntries(result.leaderboard));
    } catch {
      // The next score update or reconnect will try again.
    }
  }, [event.id]);

  const onScoreUpdate = useCallback(
    (msg: ScoreUpdateMessage) => {
      // A team we haven't seen yet (the message has no name): load the full board.
      if (!entriesRef.current?.some((entry) => entry.teamId === msg.teamId)) {
        void refetch();
        return;
      }
      setEntries((current) =>
        current
          ? rankEntries(
              current.map((entry) =>
                entry.teamId === msg.teamId
                  ? { ...entry, totalScore: msg.totalScore, lastScoredAt: msg.lastScoredAt }
                  : entry
              )
            )
          : current
      );
    },
    [refetch]
  );

  // The server sends a status snapshot on every (re)connect. Refetch on
  // reconnects (scores may have changed while offline), or if the first load failed.
  const onEventStatus = useCallback(() => {
    if (connectedOnce.current || entriesRef.current === null) void refetch();
    connectedOnce.current = true;
  }, [refetch]);

  useEventStream({
    eventId: event.id,
    accessToken,
    allowAnonymous: true,
    initialStatus: event.status,
    onEventStatus,
    onScoreUpdate,
  });

  return (
    <PageShell
      width="max-w-2xl"
      eyebrow={event.name}
      title="Leaderboard"
      description="Highest score wins. Ties go to the team that got there first."
    >
      {entries === null ? (
        <p role="alert" className="text-center text-sm text-destructive">
          Couldn&apos;t load the leaderboard. Retrying…
        </p>
      ) : entries.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No teams have joined this hunt yet.
        </p>
      ) : (
        <ol className="grid gap-3">
          {entries.map((entry) => (
            <motion.li
              key={entry.teamId}
              layout="position"
              transition={{ layout: { type: "spring", stiffness: 350, damping: 30 } }}
            >
              <Card size="sm">
                <CardContent className="flex items-center gap-4">
                  <span className="w-8 font-heading text-2xl text-primary">{entry.rank}</span>
                  <p className="flex-1 font-medium">{entry.name}</p>
                  <motion.span
                    key={entry.totalScore}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="font-semibold tabular-nums"
                  >
                    {entry.totalScore}
                  </motion.span>
                </CardContent>
              </Card>
            </motion.li>
          ))}
        </ol>
      )}
      <Link
        href="/"
        className="text-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to home
      </Link>
    </PageShell>
  );
}
