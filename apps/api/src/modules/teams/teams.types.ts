import type { Team, Profile, TeamScore } from "@dsc-hunt/types";

export interface CreateTeamInput {
  name?: string | null;
}

export interface TeamDetail {
  team: Team;
  members: Array<{
    userId: string;
    joinedAt: string;
    profile: Profile | null;
  }>;
}

export interface AdminTeamDetail {
  team: Team;
  members: Array<{ userId: string; joinedAt: string }>;
  score: TeamScore;
}

export interface TeamRow {
  id: string;
  event_id: string;
  code: string;
  name: string | null;
  created_at: string;
}

export interface TeamMemberRow {
  team_id: string;
  event_id: string;
  user_id: string;
  joined_at: string;
}
