export type EventStatus = "not_started" | "live" | "ended";

export const EVENT_STATUSES: readonly EventStatus[] = ["not_started", "live", "ended"];

/** A hunt. Lifecycle is one-way: not_started -> live -> ended. */
export interface Event {
  id: string;
  name: string;
  status: EventStatus;
  /** Set when an admin starts the hunt; null before that. */
  startedAt: string | null;
  /** Set when an admin ends the hunt; null before that. */
  endedAt: string | null;
  /** Most players a team can have. */
  teamSizeCap: number;
  /** Venue where the event is held and the hunt is introduced. Null until set. */
  startingLocationName: string | null;
  /** Optional extra directions for the venue (room, time, landmark). */
  startingLocationDetails: string | null;
  createdAt: string;
}
