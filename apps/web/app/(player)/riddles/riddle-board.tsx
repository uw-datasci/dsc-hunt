"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, LockKeyhole, QrCode } from "lucide-react";
import { Badge } from "@dsc-hunt/ui/components/badge";
import { Button } from "@dsc-hunt/ui/components/button";
import { Card, CardContent } from "@dsc-hunt/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@dsc-hunt/ui/components/dialog";
import { Input } from "@dsc-hunt/ui/components/input";
import { cn } from "@dsc-hunt/ui/lib/utils";
import type { EventStatus, RiddleCard, RiddlesResponse } from "@dsc-hunt/types";
import {
  useEventStream,
  type EventStatusMessage,
  type TeamProgressMessage,
} from "@/hooks/use-event-stream";

const COOLDOWN_SECONDS = 5;
const REQUEST_TIMEOUT_MS = 15_000;
const REFETCH_RETRY_DELAYS_MS = [1_000, 3_000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const asSentence = (message: string) => (/[.!?]$/.test(message) ? message : `${message}.`);

interface RiddleBoardProps {
  initialProgress: RiddlesResponse;
  accessToken: string | null;
  initialStatus: EventStatus;
}

interface ApiError {
  error?: string;
}

export function RiddleBoard({
  initialProgress,
  accessToken,
  initialStatus,
}: Readonly<RiddleBoardProps>) {
  const router = useRouter();
  const [progress, setProgress] = useState(initialProgress);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resyncing, setResyncing] = useState(false);
  const [incorrect, setIncorrect] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<number | null>(null);
  const connectedOnce = useRef(false);
  /** Bumped on every board update, so a slow refetch can't overwrite newer state. */
  const progressVersion = useRef(0);

  const applyProgress = useCallback((next: RiddlesResponse) => {
    progressVersion.current += 1;
    setProgress(next);
  }, []);

  /**
   * Reloads the board from the server, retrying a couple of times. Resolves
   * true once the board is current: this fetch landed, or newer state arrived
   * while it ran (an older snapshot must not overwrite it).
   */
  const refetch = useCallback(async (): Promise<boolean> => {
    const startedAt = progressVersion.current;
    for (let attempt = 0; attempt <= REFETCH_RETRY_DELAYS_MS.length; attempt++) {
      if (attempt > 0) await sleep(REFETCH_RETRY_DELAYS_MS[attempt - 1]!);
      if (progressVersion.current !== startedAt) return true;
      try {
        const response = await fetch(
          `/api/events/${encodeURIComponent(initialProgress.eventId)}/riddles`,
          { cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
        );
        if (!response.ok) continue;
        const next = (await response.json()) as RiddlesResponse;
        if (progressVersion.current !== startedAt) return true;
        applyProgress(next);
        return true;
      } catch {
        // Network error, timeout or a non-JSON reply: try again.
      }
    }
    return false;
  }, [initialProgress.eventId, applyProgress]);

  // A teammate flipped, solved or scanned. Messages leave out riddle text, so
  // keep the text we have and fetch it if a newly revealed card needs it.
  const onTeamProgress = useCallback(
    (msg: TeamProgressMessage) => {
      // Messages leave out text and images: keep what we have; the refetch
      // below fills in newly revealed cards.
      const riddles = msg.riddles.map(({ position, status }) => {
        const known = progress.riddles.find((r) => r.position === position);
        return {
          position,
          status,
          text: known?.text ?? null,
          hasImage: known?.hasImage ?? false,
          locationName: known?.locationName ?? null,
        };
      });
      applyProgress({ ...progress, riddles, activeRiddle: msg.activeRiddle });
      setAnswer("");
      // A teammate solved or scanned: drop any cooldown left from the old riddle.
      if (msg.activeRiddle !== progress.activeRiddle) {
        setIncorrect(null);
        setCooldownSeconds(0);
      }
      const missingText = riddles.some(
        (r) =>
          (!r.text && (r.status !== "unvisited" || msg.activeRiddle === r.position)) ||
          (!r.locationName && r.status !== "unvisited")
      );
      if (missingText) void refetch();
    },
    [progress, refetch, applyProgress]
  );

  // The server sends a status snapshot on every (re)connect. Refetch then so
  // anything missed while offline shows up. Also covers the hunt ending.
  const onEventStatus = useCallback(
    (msg: EventStatusMessage) => {
      if (msg.status === "ended") {
        router.replace("/finished");
        return;
      }
      // Back online and caught up: an earlier connection error no longer applies.
      if (connectedOnce.current) {
        void refetch().then((synced) => {
          if (synced) setError(null);
        });
      }
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

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setCooldownSeconds((seconds) => seconds - 1);
      if (cooldownSeconds === 1) setIncorrect(null);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  async function post(position: number, action: "flip" | "answer") {
    setError(null);
    setSubmitting(true);
    let answered = false;
    try {
      answered = await send(position, action);
    } finally {
      setSubmitting(false);
    }
    if (!answered) await resync();
  }

  /**
   * A request failed without a clear answer, so the server may or may not
   * have applied it. Pull the true board instead of guessing. The form stays
   * usable meanwhile.
   */
  async function resync() {
    setResyncing(true);
    const synced = await refetch();
    setResyncing(false);
    setError(
      synced
        ? "We couldn't confirm that with the hunt server, so your board was re-synced."
        : "Unable to reach the hunt server."
    );
  }

  /** Sends a flip or answer. Resolves false when there was no usable reply. */
  async function send(position: number, action: "flip" | "answer"): Promise<boolean> {
    try {
      const response = await fetch(
        `/api/events/${encodeURIComponent(progress.eventId)}/riddles/${position}/${action}`,
        {
          method: "POST",
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          ...(action === "answer"
            ? {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answer }),
              }
            : {}),
        }
      );
      // 5xx (including a timed-out API) says nothing about whether it went through.
      if (response.status >= 500) return false;
      const result = (await response.json()) as RiddlesResponse | ApiError;
      if (!response.ok) {
        const message = (result as ApiError).error ?? `Request failed (${response.status})`;
        // 400 = wrong answer, 429 = a teammate's wrong answer is still cooling down.
        if (action === "answer" && (response.status === 400 || response.status === 429)) {
          setAnswer("");
          setIncorrect(response.status === 400 ? "Incorrect answer. Try again!" : message);
          setCooldownSeconds(COOLDOWN_SECONDS);
        } else {
          setError(message);
          // 409 = a teammate changed the board first, so catch up with the server.
          if (response.status === 409) void refetch();
        }
        return true;
      }
      applyProgress(result as RiddlesResponse);
      if (action === "answer") {
        setAnswer("");
        setIncorrect(null);
        setCooldownSeconds(0);
      }
      return true;
    } catch {
      // Network error, timeout, or a reply that isn't JSON.
      return false;
    }
  }

  /** Stable route; the API redirects to a short-lived signed URL. */
  function imageSrc(position: number) {
    return `/api/events/${encodeURIComponent(progress.eventId)}/riddles/${position}/image`;
  }

  function renderCard(riddle: RiddleCard, index: number) {
    // The active riddle stays flipped from reveal until its QR code is scanned.
    const isFlipped = progress.activeRiddle === riddle.position;
    const isSolved = riddle.status === "solved";
    const isVisited = riddle.status === "visited";
    const isLocked = !isVisited && !isFlipped && progress.activeRiddle !== null;
    const isCoolingDown = cooldownSeconds > 0;

    return (
      <li key={riddle.position} className="h-64 [perspective:1000px]">
        <div
          className={cn(
            "relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] motion-reduce:transition-none",
            isFlipped && "[transform:rotateY(180deg)]"
          )}
        >
          {/* Face-down card */}
          <button
            type="button"
            disabled={isVisited || isLocked || isFlipped || submitting}
            onClick={() => void post(riddle.position, "flip")}
            aria-label={
              isVisited
                ? `Riddle ${index + 1}, completed`
                : isLocked
                  ? `Riddle ${index + 1}, locked`
                  : `Reveal riddle ${index + 1}`
            }
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center rounded-xl border p-6 text-center [backface-visibility:hidden]",
              isVisited && "border-emerald-500/30 bg-emerald-500/10 opacity-70",
              isLocked && "cursor-not-allowed border-muted bg-muted/30 opacity-50",
              !isVisited &&
                !isLocked &&
                !isFlipped &&
                "cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
            )}
          >
            {isVisited ? (
              <>
                <span className="font-heading text-3xl text-emerald-500">✓</span>
                <span className="mt-3 font-semibold">Completed</span>
              </>
            ) : isLocked ? (
              <>
                <LockKeyhole className="mb-3 h-7 w-7 text-muted-foreground" />
                <span className="font-heading text-3xl">{index + 1}</span>
                <span className="mt-2 text-xs text-muted-foreground">Locked</span>
              </>
            ) : (
              <>
                <span className="font-heading text-5xl text-primary">{index + 1}</span>
                <span className="mt-3 text-sm text-muted-foreground">Tap to reveal</span>
              </>
            )}
          </button>

          {/* Flipped card */}
          <Card
            size="sm"
            aria-hidden={!isFlipped}
            className="absolute inset-0 [transform:rotateY(180deg)] overflow-y-auto [backface-visibility:hidden]"
          >
            <CardContent className="flex h-full flex-col">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-widest text-primary uppercase">
                  Riddle {index + 1}
                </span>
                {isSolved ? (
                  <Badge className="bg-accent text-accent-foreground">Solved</Badge>
                ) : null}
              </div>

              {isSolved ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <QrCode className="mb-3 h-8 w-8 text-primary" />
                  <p className="font-semibold">Solved!</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {riddle.locationName ? (
                      <>
                        Go to{" "}
                        <span className="font-semibold text-foreground">
                          {riddle.locationName}
                        </span>{" "}
                        and scan the QR code to unlock your next riddle.
                      </>
                    ) : (
                      "Go to the location and scan the QR code to unlock your next riddle."
                    )}
                  </p>
                </div>
              ) : isFlipped ? (
                <>
                  {riddle.hasImage ? (
                    <button
                      type="button"
                      onClick={() => setZoomedImage(riddle.position)}
                      className="mb-3 overflow-hidden rounded-lg border"
                      aria-label={`Enlarge the picture for riddle ${index + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- signed URL via redirect, not optimizable */}
                      <img
                        src={imageSrc(riddle.position)}
                        alt={`Picture for riddle ${index + 1}`}
                        loading="lazy"
                        className="max-h-28 w-full object-contain"
                      />
                    </button>
                  ) : null}
                  <p className="mb-4 flex-1 text-sm leading-relaxed">
                    {riddle.text ?? (
                      <span className="text-muted-foreground">
                        Riddle text is not configured yet.
                      </span>
                    )}
                  </p>
                  <form
                    className="grid gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void post(riddle.position, "answer");
                    }}
                  >
                    <Input
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      placeholder="Your answer"
                      aria-label={`Answer for riddle ${index + 1}`}
                      disabled={submitting || isCoolingDown}
                    />
                    {incorrect ? (
                      <p role="alert" className="text-sm font-medium text-destructive">
                        {incorrect}
                      </p>
                    ) : null}
                    <Button
                      type="submit"
                      disabled={submitting || isCoolingDown || !answer.trim()}
                    >
                      {isCoolingDown ? `Wait ${cooldownSeconds}s` : "Submit"}
                    </Button>
                  </form>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </li>
    );
  }

  const visitedCount = progress.riddles.filter((riddle) => riddle.status === "visited").length;

  return (
    <>
      <p className="text-center text-sm text-muted-foreground">
        {visitedCount} / {progress.riddles.length} locations completed
      </p>
      {resyncing ? (
        <p role="status" className="text-center text-sm text-muted-foreground">
          Reconnecting to the hunt server…
        </p>
      ) : error ? (
        <div role="alert" className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-destructive">
            {asSentence(error)} Refresh the page to try again.
          </p>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            Refresh page
          </Button>
        </div>
      ) : null}
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {progress.riddles.map((riddle, index) => renderCard(riddle, index))}
      </ol>
      <p className="text-center text-sm text-muted-foreground">
        Solve a riddle, head to its location, and scan the QR code to confirm your visit. Your
        next riddle unlocks after each scan.
      </p>

      <Dialog
        open={zoomedImage !== null}
        onOpenChange={(open) => !open && setZoomedImage(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Riddle {zoomedImage}
            </DialogTitle>
            <DialogDescription>Pinch or zoom in for detail.</DialogDescription>
          </DialogHeader>
          {zoomedImage !== null ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed URL via redirect
            <img
              src={imageSrc(zoomedImage)}
              alt={`Picture for riddle ${zoomedImage}`}
              className="max-h-[70vh] w-full object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
