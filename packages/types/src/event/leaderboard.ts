/** One row on the hunt leaderboard. Higher `totalScore` ranks first. */
export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  name: string;
  totalScore: number;
}
