export interface LeaderboardRow {
  team_id: string;
  team_name: string;
  total_score: number;
  last_scored_at: Date | string | null;
}
