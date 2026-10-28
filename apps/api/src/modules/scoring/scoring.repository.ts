import type { DatabaseTransaction } from "@dsc-hunt/db";

export const VISIT_POINTS = [100, 75, 50, 25, 25, 10] as const;

export function pointsForVisit(visited: number): number {
  return VISIT_POINTS[Math.min(visited, VISIT_POINTS.length - 1)] ?? VISIT_POINTS[5];
}

export interface ScoredVisit {
  /** Points this visit earned (its tier at the location). */
  points: number;
  totalScore: number;
  lastScoredAt: string;
}

interface LocationRow {
  visited: number;
}

interface TeamScoreRow {
  total_score: number;
  last_scored_at: string;
}

export class ScoringRepository {
  async scoreVisit(
    transaction: DatabaseTransaction,
    teamId: string,
    locationId: string
  ): Promise<ScoredVisit> {
    const location = (
      await transaction.query<LocationRow>(
        `SELECT visited
         FROM locations
         WHERE location_id = $1
         FOR UPDATE`,
        [locationId]
      )
    )[0];
    if (!location) throw new Error("Location not found");

    const points = pointsForVisit(location.visited);
    await transaction.query(
      `INSERT INTO visits (location_id, team_id, points)
       VALUES ($1, $2, $3)`,
      [locationId, teamId, points]
    );
    await transaction.query(
      `UPDATE locations
       SET visited = visited + 1
       WHERE location_id = $1`,
      [locationId]
    );

    const team = (
      await transaction.query<TeamScoreRow>(
        `UPDATE teams
         SET total_score = total_score + $2,
             last_scored_at = now()
         WHERE team_id = $1
         RETURNING total_score, last_scored_at::text AS last_scored_at`,
        [teamId, points]
      )
    )[0];
    if (!team) throw new Error("Team not found");

    return {
      points,
      totalScore: team.total_score,
      lastScoredAt: team.last_scored_at,
    };
  }
}
