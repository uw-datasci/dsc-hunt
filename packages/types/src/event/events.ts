export type EventStatus = "draft" | "active" | "ended" | "archived";

export interface Event {
  id: string;
  name: string;
  /** Null until the event is started - drafts have no start time. */
  startsAt: string | null;
  /** Game length in minutes. Stored on the row. */
  durationMinutes: number;
  /**
   * Stored end of the timer, set on start as `startsAt + durationMinutes`
   * and shifted forward by pause/resume. Null until started.
   */
  endsAt: string | null;
  /** Set while the live timer is paused; the frozen remaining time is `endsAt - pausedAt`. */
  pausedAt: string | null;
  teamSizeCap: number;
  /** Number of questions the game is configured for. Scoring denominator, and the
   *  exact count `start` requires before the event can go live. */
  questionCount: number;
  /** Total submissions a team may make across the whole event. Revisions count. */
  submissionCap: number;
  status: EventStatus;
  createdAt: string;
}

/** Live counters for an event's admin overview - recomputed on join/leave/submit. */
export interface EventStats {
  teamCount: number;
  playerCount: number;
  /** The event's configured question count. */
  questionCount: number;
  /** Average distinct questions answered per team. */
  avgAnswered: number;
  /** Teams that have answered every question at least once. */
  finishedCount: number;
}
