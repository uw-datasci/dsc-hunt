"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Team } from "@dsc-hunt/types";
import { Button } from "@dsc-hunt/ui/components/button";
import { Input } from "@dsc-hunt/ui/components/input";
import { Label } from "@dsc-hunt/ui/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@dsc-hunt/ui/components/card";
import { apiErrorMessage } from "@/lib/api/error-message";

interface TeamOnboardingProps {
  /** Null when there's no hunt yet; both forms are disabled. */
  readonly eventId: string | null;
}

type Action = "create" | "join";

export function TeamOnboarding({ eventId }: TeamOnboardingProps) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [pending, setPending] = useState<Action | null>(null);
  // Stays true while the page re-renders with the new team after a success.
  const [refreshing, startRefresh] = useTransition();
  const busy = pending !== null || refreshing;

  async function submit(action: Action, url: string, body?: object) {
    setPending(action);
    try {
      const response = await fetch(url, {
        method: "POST",
        ...(body
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      });
      if (!response.ok) {
        const fallback =
          action === "create" ? "Couldn't create the team" : "Couldn't join the team";
        toast.error(await apiErrorMessage(response, fallback));
        return;
      }
      const { team } = (await response.json()) as { team: Team };
      toast.success(action === "create" ? `Created ${team.name}` : `Joined ${team.name}`);
      startRefresh(() => router.refresh());
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPending(null);
    }
  }

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!eventId || busy) return;
    const name = teamName.trim();
    void submit(
      "create",
      `/api/events/${encodeURIComponent(eventId)}/teams`,
      name ? { name } : {}
    );
  }

  function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!eventId || busy || joinCode.length !== 5) return;
    void submit(
      "join",
      `/api/events/${encodeURIComponent(eventId)}/teams/${encodeURIComponent(joinCode)}/join`
    );
  }

  return (
    <div className="grid gap-4">
      {eventId ? null : (
        <p className="text-center text-sm text-muted-foreground">
          The hunt isn&apos;t set up yet. Check back soon.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create a team</CardTitle>
            <CardDescription>
              You&apos;ll get a 5-digit code to share with your teammates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={handleCreate}>
              <div className="grid gap-2">
                <Label htmlFor="team-name">
                  Team name{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="team-name"
                  placeholder="The Pumpkin Patch"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  maxLength={64}
                  disabled={!eventId}
                />
              </div>
              <Button type="submit" disabled={!eventId || busy}>
                {pending === "create" ? "Creating…" : "Create team"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Join a team</CardTitle>
            <CardDescription>Enter the code your teammate shared.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={handleJoin}>
              <div className="grid gap-2">
                <Label htmlFor="team-code">Team code</Label>
                <Input
                  id="team-code"
                  placeholder="12345"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={5}
                  className="tracking-[0.4em] tabular-nums"
                  disabled={!eventId}
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                disabled={!eventId || busy || joinCode.length !== 5}
              >
                {pending === "join" ? "Joining…" : "Join"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
