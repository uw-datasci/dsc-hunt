"use client";

import { useEffect, useState } from "react";
import { Badge } from "@dsc-hunt/ui/components/badge";
import { Button } from "@dsc-hunt/ui/components/button";
import { Card, CardContent } from "@dsc-hunt/ui/components/card";
import { Input } from "@dsc-hunt/ui/components/input";
import { cn } from "@dsc-hunt/ui/lib/utils";
import type { RiddleCard, RiddlesResponse, TeamProgressUpdate } from "@dsc-hunt/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface RiddleBoardProps {
  initialProgress: RiddlesResponse;
  supabaseUrl: string;
  supabasePublishableKey: string;
}

interface ApiError {
  error?: string;
}

export function RiddleBoard({
  initialProgress,
  supabaseUrl,
  supabasePublishableKey,
}: RiddleBoardProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient(supabaseUrl, supabasePublishableKey);
    const channel = supabase
      .channel(`team:${initialProgress.teamId}`, { config: { private: true } })
      .on("broadcast", { event: "team_progress" }, ({ payload }) => {
        const update = payload as TeamProgressUpdate;
        if (update.type !== "team_progress" || update.teamId !== initialProgress.teamId) return;
        setProgress((current) => ({ ...current, ...update }));
        setAnswer("");
      })
      .subscribe((status, subscriptionError) => {
        if (status === "SUBSCRIBED") {
          setError(null);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setError(subscriptionError?.message ?? "Live sync disconnected. Reconnecting...");
        }
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [initialProgress.teamId, supabasePublishableKey, supabaseUrl]);

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
