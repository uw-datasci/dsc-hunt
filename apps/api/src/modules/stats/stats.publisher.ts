import type { FastifyBaseLogger } from "fastify";
import type { EventHub } from "../realtime/event-hub";
import type { StatsRepository } from "./stats.repository";

/**
 * Sends fresh dashboard stats to staff after anything that moves a number or
 * a start blocker. Best effort: errors are logged, never thrown, so a
 * committed change never turns into a failed request.
 */
export class StatsPublisher {
  constructor(
    private readonly repository: StatsRepository,
    private readonly hub: EventHub,
    private readonly log?: FastifyBaseLogger
  ) {}

  async publish(eventId: string): Promise<void> {
    try {
      const stats = await this.repository.forEvent(eventId);
      this.hub.publishToStaff(eventId, { type: "event_stats", eventId, stats });
    } catch (error) {
      this.log?.warn({ err: error, eventId }, "failed to publish event stats");
    }
  }
}
