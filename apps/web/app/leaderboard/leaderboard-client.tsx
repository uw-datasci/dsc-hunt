
"use client";

import { useEffect, useState } from "react";
import type { LeaderboardEntry } from "@dsc-hunt/types";
import { Card, CardContent } from "@dsc-hunt/ui/components/card";
import { PageShell } from "@/components/shared/page-shell";
import { motion } from "framer-motion";

interface LeaderboardClientProps {
  eventId: string;
  eventName: string;
}

export default function LeaderboardClient({
  eventId,
  eventName,
}: LeaderboardClientProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLeaderboard() {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          throw new Error("NEXT_PUBLIC_API_URL is not configured.");
        }

        const response = await fetch(
          `${apiUrl}/events/${eventId}/leaderboard`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`Failed to load leaderboard (${response.status})`);
        }

        const result: { leaderboard: LeaderboardEntry[] } =
          await response.json();

        if (!cancelled) {
          setLeaderboard(result.leaderboard);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <PageShell
      width="max-w-2xl"
      eyebrow={eventName}
      title="Leaderboard"
      description="Highest score wins. Ties go to the team that got there first."
    >
      {loading && <p>Loading leaderboard...</p>}

      {error && (
        <p role="alert">Could not load leaderboard: {error}</p>
      )}

      {!loading && !error && leaderboard.length === 0 && (
        <p>No teams have joined this event yet.</p>
      )}

      {!error && (
        <ol className="grid gap-3">
        {leaderboard.map((entry) => (
            <motion.li
            key={entry.teamId}
            layout="position"
            transition={{
                layout: {
                type: "spring",
                stiffness: 350,
                damping: 30,
                },
            }}
            >
            <Card size="sm">
                <CardContent className="flex items-center gap-4">
                <span className="w-8 font-heading text-2xl text-primary">
                    {entry.rank}
                </span>
                <p className="flex-1 font-medium">{entry.name}</p>
                <span className="font-semibold tabular-nums">
                    {entry.totalScore}
                </span>
                </CardContent>
            </Card>
            </motion.li>
        ))}
        </ol>

      )}
    </PageShell>
  );
}
