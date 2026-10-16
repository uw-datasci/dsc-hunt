"use client";

import { useEffect, useState } from "react";
import { Badge } from "@dsc-hunt/ui/components/badge";
import { Card, CardContent } from "@dsc-hunt/ui/components/card";
import { cn } from "@dsc-hunt/ui/lib/utils";
import { PageShell } from "@/components/shared/page-shell";
import { LockKeyhole, QrCode } from "lucide-react";

export const dynamic = "force-dynamic";

type RiddleStatus = "unvisited" | "active" | "solved" | "visited";

type Riddle = {
  id: string;
  text: string;
  answer: string;
  location: string;
  status: RiddleStatus;
};

const INITIAL_RIDDLES: Riddle[] = [
  {
    id: "1",
    text: "im the biggest, the largest",
    answer: "bigxthaplug",
    status: "unvisited",
    location: "DWE bathroom"
  },
  {
    id: "2",
    text: "turn this tv off",
    answer: "kendrick lamar",
    status: "unvisited",
    location: "MC 2041"
  },
  {
    id: "3",
    text: "shout out my label that's me",
    answer: "lil baby",
    status: "unvisited",
    location: "STC 0040"
  },
  {
    id: "4",
    text: "couldn't afford a car so she named her daughter alexis",
    answer: "kanye west",
    status: "unvisited",
    location: "QNC 1010"
  },
  {
    id: "5",
    text: "a milli a milli a milli a milli",
    answer: "lil wayne",
    status: "unvisited",
    location: "M3 3020"
  },
  {
    id: "6",
    text: "hey whats up hello",
    answer: "fetty wap",
    status: "unvisited",
    location: "SLC Quesada"
  },
];

export default function RiddlesPage() {
  const [riddles, setRiddles] = useState(INITIAL_RIDDLES);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [incorrectId, setIncorrectId] = useState<string | null>(null);
  const [cooldownId, setCooldownId] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [scanningId, setScanningId] = useState<string | null>(null);

  const activeRiddle = riddles.find(
    (riddle) => riddle.status === "active" || riddle.status === "solved"
  );

  const completedCount = riddles.filter(
    (riddle) => riddle.status === "visited"
  ).length;

  useEffect(() => {
    if (!cooldownId || cooldownSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setCooldownSeconds((seconds) => seconds - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownId, cooldownSeconds]);

  useEffect(() => {
    if (cooldownId && cooldownSeconds === 0) {
      setCooldownId(null);
      setIncorrectId(null);
    }
  }, [cooldownId, cooldownSeconds]);

  function openRiddle(id: string) {
    if (activeRiddle || riddles.find((riddle) => riddle.id === id)?.status !== "unvisited") {
      return;
    }

    setRiddles((current) =>
      current.map((riddle) =>
        riddle.id === id ? { ...riddle, status: "active" } : riddle
      )
    );
  }

  function submitAnswer(riddle: Riddle) {
    if (cooldownId || !answers[riddle.id]?.trim()) return;

    const submitted = answers[riddle.id]!.trim().toLowerCase();
    const acceptedAnswers = riddle.answer
      .split("|")
      .map((answer) => answer.trim().toLowerCase());

    if (acceptedAnswers.includes(submitted)) {
      setRiddles((current) =>
        current.map((item) =>
          item.id === riddle.id ? { ...item, status: "solved" } : item
        )
      );
      setAnswers((current) => ({ ...current, [riddle.id]: "" }));
      setIncorrectId(null);
      return;
    }

    setAnswers((current) => ({ ...current, [riddle.id]: "" }));
    setIncorrectId(riddle.id);
    setCooldownId(riddle.id);
    setCooldownSeconds(5);
  }

  function simulateQrScan(id: string) {
    setScanningId(id);

    setRiddles((current) =>
      current.map((riddle) =>
        riddle.id === id ? { ...riddle, status: "visited" } : riddle
      )
    );

    setScanningId(null);
  }

  return (
    <PageShell
      width="max-w-2xl"
      eyebrow="The Pumpkin Patch"
      title="Your riddles"
      description={`${completedCount} / ${riddles.length} locations completed`}
    >
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {riddles.map((riddle, index) => {
          const isActive = riddle.status === "active";
          const isSolved = riddle.status === "solved";
          const isVisited = riddle.status === "visited";
          const isFlipped = isActive || isSolved;
          const isLocked =
            !isVisited && !isFlipped && activeRiddle !== undefined;
          const isCoolingDown = cooldownId === riddle.id;

          return (
            <li key={riddle.id} className="h-64 [perspective:1000px]">
              <div
                className={cn(
                  "relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]",
                  isFlipped && "[transform:rotateY(180deg)]"
                )}
              >
                {/* Face-down card */}
                <button
                  type="button"
                  disabled={isVisited || isLocked || isFlipped}
                  onClick={() => openRiddle(riddle.id)}
                  className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center rounded-xl border p-6 text-center [backface-visibility:hidden]",
                    isVisited &&
                      "border-emerald-500/30 bg-emerald-500/10 opacity-70",
                    isLocked &&
                      "cursor-not-allowed border-muted bg-muted/30 opacity-50",
                    !isVisited &&
                      !isLocked &&
                      !isFlipped &&
                      "cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
                  )}
                >
                  {isVisited ? (
                    <>
                      <span className="font-heading text-3xl text-emerald-500">
                        ✓
                      </span>
                      <span className="mt-3 font-semibold">Completed</span>
                      <Badge className="mt-2">Visited</Badge>
                    </>
                  ) : isLocked ? (
                    <>
                      <LockKeyhole className="mb-3 h-7 w-7 text-muted-foreground" />
                      <span className="font-heading text-3xl">
                        {index + 1}
                      </span>
                      <span className="mt-2 text-xs text-muted-foreground">
                        Locked
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-heading text-5xl text-primary">
                        {index + 1}
                      </span>
                      <span className="mt-3 text-sm text-muted-foreground">
                        Tap to reveal
                      </span>
                    </>
                  )}
                </button>

                {/* Flipped card */}
                <Card
                  className="absolute inset-0 overflow-y-auto [backface-visibility:hidden] [transform:rotateY(180deg)]"
                  size="sm"
                >
                  <CardContent className="flex h-full flex-col p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Riddle {index + 1}
                      </span>
                      {isSolved && (<>
                        <Badge className="bg-accent text-accent-foreground">
                          Solved
                        </Badge>
                        </>
                      )}
                    </div>

                    {isSolved ? (
                      <div className="flex flex-1 flex-col items-center justify-center text-center">
                        <QrCode className="mb-3 h-8 w-8 text-primary" />
                        <h2 className="text-lg font-bold">{riddle.location}</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Go to the location and scan the QR code to unlock
                          your next riddle.
                        </p>

                        {/* Temporary frontend-only QR scan simulation */}
                        <button
                          type="button"
                          disabled={scanningId === riddle.id}
                          onClick={() => simulateQrScan(riddle.id)}
                          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                          {scanningId === riddle.id
                            ? "Scanning..."
                            : "Simulate QR scan"}
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="mb-4 flex-1 text-sm leading-relaxed">
                          {riddle.text}
                        </p>

                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            submitAnswer(riddle);
                          }}
                          className="space-y-3"
                        >
                          <input
                            value={answers[riddle.id] ?? ""}
                            onChange={(event) =>
                              setAnswers((current) => ({
                                ...current,
                                [riddle.id]: event.target.value,
                              }))
                            }
                            disabled={isCoolingDown}
                            placeholder="Your answer..."
                            aria-label={`Answer for riddle ${index + 1}`}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                          />

                            {incorrectId === riddle.id && (
                            <p className="text-sm font-medium text-destructive">
                                Incorrect answer. Try again!
                            </p>
                            )}

                          <button
                            type="submit"
                            disabled={
                              !answers[riddle.id]?.trim() || isCoolingDown
                            }
                            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isCoolingDown
                              ? `Wait ${cooldownSeconds}s`
                              : "Submit"}
                          </button>
                        </form>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        🎃 Solve a riddle, visit its location, and scan the QR code to confirm
        your visit. Your next riddle unlocks after each scan.
      </p>
    </PageShell>
  );
}