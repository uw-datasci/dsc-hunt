import type { Event, EventStats, EventStatus } from "@dsc-hunt/types";
import { HttpError } from "../../lib/http-error";
import type { EventHub } from "../realtime/event-hub";
import type { StatsPublisher } from "../stats/stats.publisher";
import type { StatsRepository } from "../stats/stats.repository";
import type { EventsRepository } from "./events.repository";

export class EventsService {
  constructor(
    private readonly repository: EventsRepository,
    private readonly hub: EventHub,
    private readonly stats: StatsRepository,
    private readonly statsPublisher: StatsPublisher | null = null
  ) {}

  /** Dashboard counters + start readiness. Staff only (enforced by the route). */
  async getStats(id: string): Promise<EventStats> {
    await this.getById(id);
    return this.stats.forEvent(id);
  }

  async getCurrent(): Promise<Event> {
    const event = await this.repository.findCurrent();
    if (!event) throw new HttpError(404, "No event exists yet");
    return event;
  }

  async getById(id: string): Promise<Event> {
    const event = await this.repository.findById(id);
    if (!event) throw new HttpError(404, "Event not found");
    return event;
  }

  /** Staff only. Allowed when every existing event has ended (or there are none). */
  async create(name: string, teamSizeCap: number): Promise<Event> {
    const trimmed = name.trim();
    if (!trimmed) throw new HttpError(400, "Event name is required");
    const created = await this.repository.create(trimmed, teamSizeCap);
    if (!created) {
      throw new HttpError(409, "Finish the current hunt before creating a new one");
    }
    return created;
  }

  /**
   * Sets the venue shown to players before the start. A blank name clears it
   * (and the details). Locked once the hunt has started.
   */
  async setStartingLocation(
    id: string,
    name: string,
    details: string | null | undefined
  ): Promise<Event> {
    const trimmedName = name.trim() || null;
    const trimmedDetails = trimmedName ? details?.trim() || null : null;

    const updated = await this.repository.setStartingLocation(id, trimmedName, trimmedDetails);
    if (updated) {
      // "Starting location set" is a start blocker on the dashboard.
      await this.statsPublisher?.publish(id);
      return updated;
    }

    const existing = await this.repository.findById(id);
    if (!existing) throw new HttpError(404, "Event not found");
    throw new HttpError(409, "The starting location is locked once the hunt starts");
  }

  /**
   * not_started -> live. Refused (409) until every start blocker is cleared:
   * all riddles configured, starting location set, at least one team.
   * Sets started_at and broadcasts to connected clients.
   */
  async start(id: string): Promise<Event> {
    const event = await this.getById(id);
    if (event.status === "not_started") {
      const { startBlockers } = await this.stats.forEvent(id);
      if (startBlockers.length > 0) {
        throw new HttpError(409, `Can't start yet: ${startBlockers.join("; ")}`);
      }
    }
    return this.transition(id, "not_started", "live");
  }

  /** live -> ended. Sets ended_at and broadcasts. There is no way back. */
  end(id: string): Promise<Event> {
    return this.transition(id, "live", "ended");
  }

  private async transition(id: string, from: EventStatus, to: EventStatus): Promise<Event> {
    const updated = await this.repository.transition(id, from, to);
    if (updated) {
      this.hub.publish(updated.id, {
        type: "event_status",
        eventId: updated.id,
        status: updated.status,
      });
      return updated;
    }

    // Nothing updated: either the event doesn't exist, or it isn't in `from`.
    const existing = await this.repository.findById(id);
    if (!existing) throw new HttpError(404, "Event not found");
    throw new HttpError(409, `Cannot move event from ${existing.status} to ${to}`);
  }
}
