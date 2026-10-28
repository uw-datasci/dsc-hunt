export interface TeamRow {
  team_id: string;
  event_id: string;
  code: string;
  team_name: string;
  created_at: string;
}

export interface TeamMemberRow {
  user_id: string;
  display_name: string;
  joined_at: string;
}

export type AddMemberResult = "added" | "full" | "missing";

export interface EventParams {
  id: string;
}

export interface JoinParams {
  id: string;
  code: string;
}

export interface TeamParams {
  id: string;
}

export interface CreateTeamBody {
  name?: string;
}
