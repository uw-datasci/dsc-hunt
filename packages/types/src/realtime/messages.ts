import type { EventStatus } from "../event/events";
import type { RiddleCard } from "../hunt/riddles";

/** Messages pushed to clients over the `GET /events/:id/stream` SSE channel. */
export type ServerMessage =
  | { type: "event_status"; eventId: string; status: EventStatus }
  | {
      /**
       * A team flipped, solved or scanned a riddle. Sent to the whole event, so
       * clients must ignore other teams' messages. Riddle text is left out so
       * other teams can't read it; clients fetch it from `GET /events/:id/riddles`.
       */
      type: "team_progress";
      eventId: string;
      teamId: string;
      riddles: Pick<RiddleCard, "position" | "status">[];
      activeRiddle: number | null;
    }
  | {
      type: "score_update";
      eventId: string;
      teamId: string;
      totalScore: number;
      lastScoredAt: string;
    };
