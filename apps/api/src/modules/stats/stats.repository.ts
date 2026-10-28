import { queryOne } from "@dsc-hunt/db";
import type { EventStats } from "@dsc-hunt/types";

export const TOTAL_RIDDLES = 6;

interface StatsRow {
  team_count: number;
  player_count: number;
  configured_riddles: number;
  scan_count: number;
  starting_location_set: boolean | null;
}

/** Why the hunt can't start yet, in the order an admin would fix them. Empty = ready. */
export function startBlockers(stats: Omit<EventStats, "startBlockers">): string[] {
  const blockers: string[] = [];
  if (stats.configuredRiddles < stats.totalRiddles) {
    blockers.push(
      `Set up all ${stats.totalRiddles} riddles (${stats.configuredRiddles}/${stats.totalRiddles} done)`
    );
  }
  if (!stats.startingLocationSet) blockers.push("Set the starting location");
  if (stats.teamCount < 1) blockers.push("Wait for at least one team to register");
  return blockers;
}

export class StatsRepository {
  async forEvent(eventId: string): Promise<EventStats> {
    const row = await queryOne<StatsRow>(
      `SELECT
         (SELECT count(*) FROM teams WHERE event_id = $1)::integer AS team_count,
         (SELECT count(*) FROM team_members WHERE event_id = $1)::integer AS player_count,
         (SELECT count(*)
            FROM riddles
            JOIN locations
              ON locations.event_id = riddles.event_id AND locations.position = riddles.position
            WHERE riddles.event_id = $1
              AND btrim(riddles.riddle_text) <> ''
              AND cardinality(riddles.answers) > 0
              AND locations.qr_identifier IS NOT NULL)::integer AS configured_riddles,
         (SELECT count(*)
            FROM visits
            JOIN teams ON teams.team_id = visits.team_id
            WHERE teams.event_id = $1)::integer AS scan_count,
         (SELECT starting_location_name IS NOT NULL FROM events WHERE id = $1)
           AS starting_location_set`,
      [eventId]
    );
    const stats = {
      teamCount: row?.team_count ?? 0,
      playerCount: row?.player_count ?? 0,
      configuredRiddles: row?.configured_riddles ?? 0,
      totalRiddles: TOTAL_RIDDLES,
      scanCount: row?.scan_count ?? 0,
      startingLocationSet: row?.starting_location_set ?? false,
    };
    return { ...stats, startBlockers: startBlockers(stats) };
  }
}
