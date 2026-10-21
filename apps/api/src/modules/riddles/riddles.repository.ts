import { query, queryOne } from "@dsc-hunt/db";
import type { LocationRow, ProgressRow, TeamStateRow } from "./riddles.types";

/**
 * `CASE` over the six riddle columns, for the riddle at position `$n`. The
 * cast matters: Postgres types a bare parameter in `CASE $n` as text.
 */
function riddleColumnAt(param: string, table = ""): string {
  const prefix = table ? `${table}.` : "";
  return `CASE (${param})::integer
      WHEN 1 THEN ${prefix}riddle_1
      WHEN 2 THEN ${prefix}riddle_2
      WHEN 3 THEN ${prefix}riddle_3
      WHEN 4 THEN ${prefix}riddle_4
      WHEN 5 THEN ${prefix}riddle_5
      WHEN 6 THEN ${prefix}riddle_6
    END`;
}

/** `SET` clause that moves the riddle at position `$n` to `status`. */
function setRiddleStatusAt(param: string, status: "solved" | "visited"): string {
  return [1, 2, 3, 4, 5, 6]
    .map((n) => `riddle_${n} = CASE WHEN ${param} = ${n} THEN '${status}' ELSE riddle_${n} END`)
    .join(",\n        ");
}

const PROGRESS_SQL = `
  SELECT positions.position,
    ${riddleColumnAt("positions.position", "teams")} AS status,
    CASE
      WHEN teams.active_riddle = positions.position
        OR ${riddleColumnAt("positions.position", "teams")} IN ('solved', 'visited')
      THEN riddles.riddle_text
      ELSE NULL
    END AS text,
    teams.active_riddle
  FROM teams
  CROSS JOIN generate_series(1, 6) AS positions(position)
  LEFT JOIN riddles
    ON riddles.event_id = teams.event_id
    AND riddles.position = positions.position
  WHERE teams.team_id = $1
  ORDER BY positions.position`;

const EVENT_IS_LIVE = `EXISTS (SELECT 1 FROM events WHERE id = $2 AND status = 'live')`;

export class RiddlesRepository {
  /** Up to two team ids, so callers can detect a user on multiple teams. */
  async findTeamIdsForUser(eventId: string, userId: string): Promise<string[]> {
    const rows = await query<{ team_id: string }>(
      `SELECT teams.team_id
       FROM teams
       JOIN team_members ON team_members.team_id = teams.team_id
       WHERE teams.event_id = $1 AND team_members.user_id = $2
       LIMIT 2`,
      [eventId, userId]
    );
    return rows.map((row) => row.team_id);
  }

  findTeamState(teamId: string): Promise<TeamStateRow | null> {
    return queryOne<TeamStateRow>(
      `SELECT team_id, active_riddle, riddle_1, riddle_2, riddle_3, riddle_4, riddle_5, riddle_6
       FROM teams
       WHERE team_id = $1`,
      [teamId]
    );
  }

  findProgress(teamId: string): Promise<ProgressRow[]> {
    return query<ProgressRow>(PROGRESS_SQL, [teamId]);
  }

  /** Activates an unvisited riddle when none is active. Returns false if nothing changed. */
  async activate(teamId: string, eventId: string, position: number): Promise<boolean> {
    const rows = await query(
      `UPDATE teams
       SET active_riddle = $3
       WHERE team_id = $1
         AND event_id = $2
         AND active_riddle IS NULL
         AND ${riddleColumnAt("$3")} = 'unvisited'
         AND ${EVENT_IS_LIVE}
       RETURNING team_id`,
      [teamId, eventId, position]
    );
    return rows.length > 0;
  }

  async findAnswer(eventId: string, position: number): Promise<string | null> {
    const row = await queryOne<{ answer: string | null }>(
      `SELECT answer FROM riddles WHERE event_id = $1 AND position = $2`,
      [eventId, position]
    );
    return row?.answer ?? null;
  }

  /** Marks the active riddle solved. Returns false if it was no longer active. */
  async markSolved(teamId: string, eventId: string, position: number): Promise<boolean> {
    const rows = await query(
      `UPDATE teams
       SET ${setRiddleStatusAt("$3", "solved")}
       WHERE team_id = $1
         AND event_id = $2
         AND active_riddle = $3
         AND ${riddleColumnAt("$3")} = 'unvisited'
         AND ${EVENT_IS_LIVE}
       RETURNING team_id`,
      [teamId, eventId, position]
    );
    return rows.length > 0;
  }

  findLocationByCode(eventId: string, code: string): Promise<LocationRow | null> {
    return queryOne<LocationRow>(
      `SELECT location_id, name, position
       FROM locations
       WHERE event_id = $1 AND qr_identifier = $2`,
      [eventId, code]
    );
  }

  /**
   * Marks the solved riddle visited, clears the active riddle, adds points and
   * records the visit in one statement. Returns false if nothing changed.
   */
  async recordVisit(
    teamId: string,
    eventId: string,
    location: LocationRow,
    points: number
  ): Promise<boolean> {
    const rows = await query(
      `WITH scanned AS (
         UPDATE teams
         SET ${setRiddleStatusAt("$3", "visited")},
             active_riddle = NULL,
             total_score = total_score + $5
         WHERE team_id = $1
           AND event_id = $2
           AND active_riddle = $3
           AND ${riddleColumnAt("$3")} = 'solved'
           AND ${EVENT_IS_LIVE}
         RETURNING team_id
       ),
       visit AS (
         INSERT INTO visits (location_id, team_id, points)
         SELECT $4::uuid, team_id, $5::integer
         FROM scanned
         RETURNING team_id
       )
       SELECT team_id FROM visit`,
      [teamId, eventId, location.position, location.location_id, points]
    );
    return rows.length > 0;
  }
}
