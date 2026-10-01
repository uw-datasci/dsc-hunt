"use client";

import { useState } from "react";
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

interface TeamOnboardingProps {
  readonly onCreate: (name: string) => void;
  readonly onJoin: (code: string) => void;
}

export function TeamOnboarding({ onCreate, onJoin }: TeamOnboardingProps) {
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  function handleCreate() {
    // TODO: POST to the create-team endpoint, surface errors via toast, and
    // use the returned team (with its generated join code).
    onCreate(teamName.trim());
  }

  function handleJoin() {
    // TODO: POST to the join-team endpoint; handle invalid code, full team
    // (team size cap TBD) and "already on a team" errors.
    onJoin(joinCode);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create a team</CardTitle>
          <CardDescription>
            You&apos;ll get a 5-digit code to share with your teammates.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="team-name">
              Team name <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="team-name"
              placeholder="The Pumpkin Patch"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              maxLength={64}
            />
          </div>
          <Button onClick={handleCreate}>Create team</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Join a team</CardTitle>
          <CardDescription>Enter the code your teammate shared.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="team-code">Team code</Label>
            <Input
              id="team-code"
              placeholder="12345"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
              inputMode="numeric"
              maxLength={5}
              className="tracking-[0.4em] tabular-nums"
            />
          </div>
          <Button variant="secondary" onClick={handleJoin} disabled={joinCode.length !== 5}>
            Join
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
