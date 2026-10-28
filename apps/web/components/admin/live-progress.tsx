"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AdminProgressResponse,
  AdminTeamProgress,
  Event,
  EventStatus,
  RiddleStatus,
  ServerMessage,
} from "@dsc-hunt/types";
import { Badge } from "@dsc-hunt/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@dsc-hunt/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@dsc-hunt/ui/components/table";
import { cn } from "@dsc-hunt/ui/lib/utils";
import { useEventStream } from "@/hooks/use-event-stream";

const REFETCH_DEBOUNCE_MS = 300;
const CLOCK_TICK_MS = 30_000;

const STATUS_LABEL: Record<EventStatus, string> = {
  not_started: "Not started",
  live: "Live",
  ended: "Ended",
};

/** Messages that mean a row or the feed may have changed. */
const ACTIVITY_TYPES = new Set<ServerMessage["type"]>([
  "team_progress",
  "score_update",
  "event_stats",
]);

type MarkerState = "idle" | "active" | "solved" | "found";

const MARKER: Record<MarkerState, { label: string; className: string }> = {
  idle: { label: "Not started", className: "border-muted-foreground/30 text-muted-foreground" },
  active: { label: "Active", className: "border-amber-500 bg-amber-500/20 text-amber-500" },
  solved: {
    label: "Solved, needs scan",
    className: "border-sky-500 bg-sky-500/20 text-sky-500",
  },
  found: { label: "Found", className: "border-emerald-500 bg-emerald-500 text-white" },
};

function markerState(
  status: RiddleStatus,
  position: number,
  active: number | null
): MarkerState {
  if (status === "visited") return "found";
  if (status === "solved") return "solved";
  return active === position ? "active" : "idle";
}

function timeAgo(iso: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}

function StatusStrip({ team }: { team: AdminTeamProgress }) {
  return (
    <div className="flex gap-1">
      {team.riddles.map((status, index) => {
        const position = index + 1;
        const state = markerState(status, position, team.activeRiddle);
        const { label, className } = MARKER[state];
        return (
          <span
            key={position}
            title={`Riddle ${position}: ${label}`}
            aria-label={`Riddle ${position}: ${label}`}
            className={cn(
              "flex size-6 items-center justify-center rounded border text-[11px] font-semibold tabular-nums",
              className,
              state === "active" && "animate-pulse"
            )}
          >
            {state === "found" ? "✓" : position}
          </span>
        );
      })}
    </div>
  );
}

interface LiveProgressProps {
  readonly event: Event;
  readonly initialProgress: AdminProgressResponse | null;
  readonly accessToken: string | null;
  readonly totalRiddles: number;
}

/**
 * Staff view of the hunt as it happens. Any team activity on the stream
 * triggers a (debounced) refetch, so rows and the feed always come from one
 * server query.
 */
export function LiveProgress({
  event,
  initialProgress,
  accessToken,
  totalRiddles,
}: LiveProgressProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [now, setNow] = useState(() => Date.now());
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectedOnce = useRef(false);

  const refetch = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/events/${encodeURIComponent(event.id)}/progress`,
        { cache: "no-store" }
      );
      if (response.ok) setProgress((await response.json()) as AdminProgressResponse);
    } catch {
      // The next message or reconnect will try again.
    }
  }, [event.id]);

  const scheduleRefetch = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => void refetch(), REFETCH_DEBOUNCE_MS);
  }, [refetch]);

  const onMessage = useCallback(
    (msg: ServerMessage) => {
      if (ACTIVITY_TYPES.has(msg.type)) scheduleRefetch();
    },
    [scheduleRefetch]
  );

  // A snapshot arrives on every (re)connect: catch up on anything missed.
  const onEventStatus = useCallback(() => {
    if (connectedOnce.current || progress === null) scheduleRefetch();
    connectedOnce.current = true;
  }, [progress, scheduleRefetch]);

  const status =
    useEventStream({
      eventId: event.id,
      accessToken,
      initialStatus: event.status,
      onEventStatus,
      onMessage,
    }) ?? event.status;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => {
      clearInterval(timer);
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
    };
  }, []);

  if (!progress) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Couldn&apos;t load live progress. Retrying when the connection catches up…
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <Badge variant={status === "live" ? "default" : "outline"}>
          {STATUS_LABEL[status]}
        </Badge>
        {(Object.keys(MARKER) as MarkerState[]).map((state) => (
          <span key={state} className="flex items-center gap-1">
            <span className={cn("size-3 rounded border", MARKER[state].className)} />
            {MARKER[state].label}
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border bg-card">
          {progress.teams.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No teams yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Riddles</TableHead>
                  <TableHead className="text-right">Found</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Last scan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progress.teams.map((team) => (
                  <TableRow key={team.teamId}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>
                      <StatusStrip team={team} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {team.found} / {totalRiddles}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{team.totalScore}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {team.lastScan
                        ? `${team.lastScan.locationName} · ${timeAgo(team.lastScan.scannedAt, now)}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent scans</CardTitle>
          </CardHeader>
          <CardContent>
            {progress.recentScans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scans yet.</p>
            ) : (
              <ul className="grid gap-2 text-sm">
                {progress.recentScans.map((scan) => (
                  <li key={`${scan.teamId}-${scan.position}`} className="text-muted-foreground">
                    🕯️ <span className="text-foreground">{scan.teamName}</span> scanned{" "}
                    <span className="text-foreground">{scan.locationName}</span>{" "}
                    <span className="tabular-nums">(+{scan.points})</span> ·{" "}
                    {timeAgo(scan.scannedAt, now)}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
