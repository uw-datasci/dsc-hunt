/** One row on the hunt leaderboard. Higher `totalScore` ranks first. */
export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  name: string;
  totalScore: number;
  /** ISO time the team last scored; the tie-break (earlier wins). Null before scoring. */
  lastScoredAt: string | null;
}
