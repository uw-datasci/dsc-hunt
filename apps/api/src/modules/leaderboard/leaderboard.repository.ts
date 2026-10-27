import { query } from "@dsc-hunt/db";
import type { LeaderboardRow } from "./leaderboard.types";

export class LeaderboardRepository {
  /**
   * Teams in an event, best first. Ties on score go to the team that reached
   * it first (earliest latest visit); teams with no visits sort last.
   */
  listForEvent(eventId: string): Promise<LeaderboardRow[]> {
    return query<LeaderboardRow>(
      `SELECT teams.team_id, teams.team_name, teams.total_score
       FROM teams
       LEFT JOIN (
         SELECT team_id, max(visited_at) AS last_visit_at
         FROM visits
         GROUP BY team_id
       ) AS latest ON latest.team_id = teams.team_id
       WHERE teams.event_id = $1
       ORDER BY teams.total_score DESC,
                latest.last_visit_at ASC NULLS LAST,
                teams.team_name ASC`,
      [eventId]
    );
  }
}
