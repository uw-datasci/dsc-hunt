import { query } from "@dsc-hunt/db";
import type { LeaderboardRow } from "./leaderboard.types";

export class LeaderboardRepository {
  /**
   * Teams in an event, best first. Ties on score go to the team that reached
   * it first (earliest `last_scored_at`, set by scoring); teams that haven't
   * scored sort last.
   */
  listForEvent(eventId: string): Promise<LeaderboardRow[]> {
    return query<LeaderboardRow>(
      `SELECT team_id, team_name, total_score, last_scored_at
       FROM teams
       WHERE event_id = $1
       ORDER BY total_score DESC,
                last_scored_at ASC NULLS LAST,
                team_name ASC`,
      [eventId]
    );
  }
}
