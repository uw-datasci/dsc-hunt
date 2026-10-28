import { query } from "@dsc-hunt/db";
import type { AdminScan, AdminTeamProgress, RiddleStatus } from "@dsc-hunt/types";

interface TeamProgressRow {
  team_id: string;
  team_name: string;
  total_score: number;
  last_scored_at: Date | string | null;
  active_riddle: number | null;
  riddle_1: RiddleStatus;
  riddle_2: RiddleStatus;
  riddle_3: RiddleStatus;
  riddle_4: RiddleStatus;
  riddle_5: RiddleStatus;
  riddle_6: RiddleStatus;
  found: number;
  last_scan_location: string | null;
  last_scan_at: Date | string | null;
}

interface ScanRow {
  team_id: string;
  team_name: string;
  position: number;
  location_name: string;
  points: number;
  visited_at: Date | string;
}

/** ISO strings everywhere, matching the leaderboard's `lastScoredAt`. */
function iso(value: Date | string): string {
  return new Date(value).toISOString();
}

export class AdminProgressRepository {
  /** Every team's riddle statuses and latest scan, in leaderboard order. */
  async teams(eventId: string): Promise<AdminTeamProgress[]> {
    const rows = await query<TeamProgressRow>(
      `SELECT teams.team_id, teams.team_name, teams.total_score, teams.last_scored_at,
              teams.active_riddle,
              teams.riddle_1, teams.riddle_2, teams.riddle_3,
              teams.riddle_4, teams.riddle_5, teams.riddle_6,
              (SELECT count(*) FROM visits WHERE visits.team_id = teams.team_id)::integer AS found,
              latest.location_name AS last_scan_location,
              latest.visited_at AS last_scan_at
       FROM teams
       LEFT JOIN LATERAL (
         SELECT locations.name AS location_name, visits.visited_at
         FROM visits
         JOIN locations ON locations.location_id = visits.location_id
         WHERE visits.team_id = teams.team_id
         ORDER BY visits.visited_at DESC
         LIMIT 1
       ) AS latest ON true
       WHERE teams.event_id = $1
       ORDER BY teams.total_score DESC, teams.last_scored_at ASC NULLS LAST, teams.team_name ASC`,
      [eventId]
    );
    return rows.map((row) => ({
      teamId: row.team_id,
      name: row.team_name,
      totalScore: row.total_score,
      lastScoredAt: row.last_scored_at ? iso(row.last_scored_at) : null,
      activeRiddle: row.active_riddle,
      riddles: [
        row.riddle_1,
        row.riddle_2,
        row.riddle_3,
        row.riddle_4,
        row.riddle_5,
        row.riddle_6,
      ],
      found: row.found,
      lastScan:
        row.last_scan_location && row.last_scan_at
          ? { locationName: row.last_scan_location, scannedAt: iso(row.last_scan_at) }
          : null,
    }));
  }

  /** The most recent scans across the event, newest first. */
  async recentScans(eventId: string, limit: number): Promise<AdminScan[]> {
    const rows = await query<ScanRow>(
      `SELECT teams.team_id, teams.team_name, locations.position,
              locations.name AS location_name, visits.points, visits.visited_at
       FROM visits
       JOIN teams ON teams.team_id = visits.team_id
       JOIN locations ON locations.location_id = visits.location_id
       WHERE teams.event_id = $1
       ORDER BY visits.visited_at DESC, visits.visit_id DESC
       LIMIT $2`,
      [eventId, limit]
    );
    return rows.map((row) => ({
      teamId: row.team_id,
      teamName: row.team_name,
      position: Number(row.position),
      locationName: row.location_name,
      points: row.points,
      scannedAt: iso(row.visited_at),
    }));
  }
}
