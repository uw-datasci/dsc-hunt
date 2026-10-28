import type { Event, TeamWithMembers } from "@dsc-hunt/types";
import { TeamLobby } from "@/components/team/team-lobby";
import { TeamOnboarding } from "@/components/team/team-onboarding";

interface TeamSetupProps {
  readonly team: TeamWithMembers | null;
  readonly event: Event | null;
  readonly accessToken: string | null;
}

/**
 * Create/join when the player has no team, otherwise the lobby. The page
 * loads the team on the server; create/join/leave call `router.refresh()`
 * so it re-renders with the new state.
 */
export function TeamSetup({ team, event, accessToken }: TeamSetupProps) {
  if (team) {
    return <TeamLobby key={team.id} team={team} event={event} accessToken={accessToken} />;
  }
  return <TeamOnboarding eventId={event?.id ?? null} />;
}
