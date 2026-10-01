"use client";

import { useState } from "react";
import { TeamLobby } from "@/components/team/team-lobby";
import { TeamOnboarding } from "@/components/team/team-onboarding";
import { PLACEHOLDER_TEAM, type PlaceholderTeam } from "@/components/team/placeholder-team";

interface TeamSetupProps {
  readonly initialTeam: PlaceholderTeam | null;
}

/**
 * Switches between create/join and the team lobby. Team state is local for
 * now so the flow can be clicked through without a backend.
 */
export function TeamSetup({ initialTeam }: TeamSetupProps) {
  // TODO: drop local state and router.refresh() after create/join/leave once
  // the server page loads the real team.
  const [team, setTeam] = useState(initialTeam);

  if (team) return <TeamLobby team={team} onLeave={() => setTeam(null)} />;

  return (
    <TeamOnboarding
      onCreate={(name) => setTeam({ ...PLACEHOLDER_TEAM, name: name || PLACEHOLDER_TEAM.name })}
      onJoin={(code) => setTeam({ ...PLACEHOLDER_TEAM, code })}
    />
  );
}
