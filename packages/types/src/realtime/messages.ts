import type { EventStatus } from "../event/events";
import type { EventStats } from "../event/stats";
import type { TeamMember } from "../event/teams";
import type { RiddleCard } from "../hunt/riddles";

/**
 * Messages pushed to clients over the `GET /events/:id/stream` SSE channel.
 * Each message's comment says who receives it.
 */
export type ServerMessage =
  /** Everyone on the event. */
  | { type: "event_status"; eventId: string; status: EventStatus }
  | {
      /**
       * A team flipped, solved or scanned a riddle. Sent only to that team's
       * members and staff. Riddle text is left out; clients fetch it from
       * `GET /events/:id/riddles`.
       */
      type: "team_progress";
      eventId: string;
      teamId: string;
      riddles: Pick<RiddleCard, "position" | "status">[];
      activeRiddle: number | null;
    }
  | {
      /** A team's score changed after a scan. Everyone on the event (leaderboard). */
      type: "score_update";
      eventId: string;
      teamId: string;
      totalScore: number;
      lastScoredAt: string;
    }
  | {
      /** A player joined or left this team. Sent only to that team's members and staff. */
      type: "team_members";
      eventId: string;
      teamId: string;
      members: TeamMember[];
    }
  | {
      /**
       * Dashboard counters and start readiness, sent after roster changes,
       * scans, riddle saves and starting-location edits. Staff only.
       */
      type: "event_stats";
      eventId: string;
      stats: EventStats;
    };
