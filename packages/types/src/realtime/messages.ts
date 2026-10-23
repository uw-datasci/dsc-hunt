import type { EventStatus } from "../event/events";

/** Messages pushed to clients over the `GET /events/:id/stream` SSE channel. */
export type ServerMessage = { type: "event_status"; eventId: string; status: EventStatus };
