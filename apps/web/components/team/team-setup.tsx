"use client";

import { useState } from "react";
import { TeamLobby } from "@/components/team/team-lobby";
import { TeamOnboarding } from "@/components/team/team-onboarding";
import { PLACEHOLDER_TEAM, type PlaceholderTeam } from "@/components/team/placeholder-team";
import type { Event } from "@dsc-hunt/types";
import { clearCurrentTeam, saveCurrentTeam } from "@/lib/team/session";

interface TeamSetupProps {
  readonly initialTeam: PlaceholderTeam | null;
  /** Current hunt; null when none exists yet or the API is unreachable. */
  readonly event: Event | null;
  readonly accessToken: string | null;
}

/**
 * Switches between create/join and the team lobby. Team state is local for
 * now so the flow can be clicked through without a backend.
 */
export function TeamSetup({ initialTeam, event, accessToken }: TeamSetupProps) {
  // TODO: drop local state and router.refresh() after create/join/leave once
  // the server page loads the real team.
  const [team, setTeam] = useState(initialTeam);

  function update(next: PlaceholderTeam | null) {
    setTeam(next);
    void (next ? saveCurrentTeam(next) : clearCurrentTeam());
  }

  if (team) {
    return (
      <TeamLobby
        team={team}
        event={event}
        accessToken={accessToken}
        onLeave={() => update(null)}
      />
    );
  }

  return (
    <TeamOnboarding
      onCreate={(name) => update({ ...PLACEHOLDER_TEAM, name: name || PLACEHOLDER_TEAM.name })}
      onJoin={(code) => update({ ...PLACEHOLDER_TEAM, code })}
    />
  );
}
