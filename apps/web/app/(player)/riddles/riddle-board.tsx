"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@dsc-hunt/ui/components/badge";
import { Button } from "@dsc-hunt/ui/components/button";
import { Card, CardContent } from "@dsc-hunt/ui/components/card";
import { Input } from "@dsc-hunt/ui/components/input";
import { cn } from "@dsc-hunt/ui/lib/utils";
import type { EventStatus, RiddleCard, RiddlesResponse } from "@dsc-hunt/types";
import {
  useEventStream,
  type EventStatusMessage,
  type TeamProgressMessage,
} from "@/hooks/use-event-stream";

interface RiddleBoardProps {
  initialProgress: RiddlesResponse;
  /** Supabase access token for the event stream. */
  accessToken: string | null;
  initialStatus: EventStatus;
}

interface ApiError {
  error?: string;
}

export function RiddleBoard({ initialProgress, accessToken, initialStatus }: RiddleBoardProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(initialProgress);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const connectedOnce = useRef(false);

  const refetch = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/events/${encodeURIComponent(initialProgress.eventId)}/riddles`
      );
      if (response.ok) setProgress((await response.json()) as RiddlesResponse);
    } catch {
      // The next stream message or reconnect will try again.
    }
  }, [initialProgress.eventId]);

  // A teammate flipped, solved or scanned. Messages leave out riddle text, so
  // keep the text we have and fetch it if a newly revealed card needs it.
  const onTeamProgress = useCallback(
    (msg: TeamProgressMessage) => {
      const riddles = msg.riddles.map(({ position, status }) => ({
        position,
        status,
        text: progress.riddles.find((r) => r.position === position)?.text ?? null,
      }));
      setProgress({ ...progress, riddles, activeRiddle: msg.activeRiddle });
      setAnswer("");
      const missingText = riddles.some(
        (r) => !r.text && (r.status !== "unvisited" || msg.activeRiddle === r.position)
      );
      if (missingText) void refetch();
    },
    [progress, refetch]
  );

  // The server sends a status snapshot on every (re)connect. Refetch then so
  // anything missed while offline shows up. Also covers the hunt ending.
  const onEventStatus = useCallback(
    (msg: EventStatusMessage) => {
      if (msg.status === "ended") {
        router.replace("/finished");
        return;
      }
      if (connectedOnce.current) void refetch();
      connectedOnce.current = true;
    },
    [refetch, router]
  );

  useEventStream({
    eventId: initialProgress.eventId,
    accessToken,
    initialStatus,
    onEventStatus,
    teamId: initialProgress.teamId,
    onTeamProgress,
  });

  async function post(position: number, action: "flip" | "answer") {
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/events/${encodeURIComponent(progress.eventId)}/riddles/${position}/${action}`,
        {
          method: "POST",
          ...(action === "answer"
            ? {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answer }),
              }
            : {}),
        }
      );
      const result = (await response.json()) as RiddlesResponse | ApiError;
      if (!response.ok) {
        setError((result as ApiError).error ?? `Request failed (${response.status})`);
        return;
      }
      setProgress(result as RiddlesResponse);
      if (action === "answer") setAnswer("");
    } catch {
      setError("Unable to reach the hunt server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderCard(riddle: RiddleCard, index: number) {
    const isActive = progress.activeRiddle === riddle.position;
    const canFlip = riddle.status === "unvisited" && progress.activeRiddle === null;

    return (
      <li key={riddle.position}>
        <Card size="sm" className={cn(riddle.status === "visited" && "opacity-70")}>
          <CardContent className="flex items-start gap-4">
            <span className="font-heading text-2xl text-primary">{index + 1}</span>
            <div className="grid flex-1 gap-3">
              {riddle.text ? (
                <p className="text-sm">{riddle.text}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isActive ? "Riddle text is not configured yet." : "This riddle is hidden."}
                </p>
              )}
              {isActive ? (
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void post(riddle.position, "answer");
                  }}
                >
                  <Input
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Your answer"
                    aria-label={`Answer for riddle ${riddle.position}`}
                    disabled={submitting}
                  />
                  <Button type="submit" disabled={submitting || !answer.trim()}>
                    Submit
                  </Button>
                </form>
              ) : null}
              {canFlip ? (
                <Button
                  className="w-fit"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => void post(riddle.position, "flip")}
                >
                  Reveal riddle
                </Button>
              ) : null}
            </div>
            <Badge
              variant={riddle.status === "unvisited" ? "outline" : "default"}
              className={
                riddle.status === "visited" ? "bg-accent text-accent-foreground" : undefined
              }
            >
              {riddle.status === "visited"
                ? "Visited"
                : riddle.status === "solved"
                  ? "Solved"
                  : isActive
                    ? "Active"
                    : "Unvisited"}
            </Badge>
          </CardContent>
        </Card>
      </li>
    );
  }

  const visitedCount = progress.riddles.filter((riddle) => riddle.status === "visited").length;

  return (
    <>
      <p className="text-center text-sm text-muted-foreground">
        {visitedCount} / {progress.riddles.length} locations found
      </p>
      {error ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <ol className="grid gap-3">
        {progress.riddles.map((riddle, index) => renderCard(riddle, index))}
      </ol>
      <p className="text-center text-sm text-muted-foreground">
        Solve a riddle, head to its location, and scan the QR code to confirm your visit.
      </p>
    </>
  );
}
