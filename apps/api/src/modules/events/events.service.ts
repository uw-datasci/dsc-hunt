import type { Event, EventStats } from "@dsc-hunt/types";
import type { EventHub } from "../realtime/event-hub";
import { QuestionsRepository } from "../questions/questions.repository";
import { EventsRepository } from "./events.repository";
import type { CreateEventInput, UpdateEventInput } from "./events.types";

class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
  }
}

function validateStartsAt(startsAt: string) {
  const start = Date.parse(startsAt);
  if (Number.isNaN(start)) throw new HttpError(400, "Invalid startsAt");
  if (start <= Date.now()) throw new HttpError(400, "startsAt must be in the future");
}

function validateDuration(durationMinutes: number) {
  if (
    !Number.isFinite(durationMinutes) ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0
  ) {
    throw new HttpError(400, "durationMinutes must be a positive integer");
  }
}

export class EventsService {
  constructor(
    private readonly repository: EventsRepository,
    private readonly hub?: EventHub,
    private readonly questions?: QuestionsRepository
  ) {}

  async getActive(): Promise<Event | null> {
    return this.repository.findCurrent();
  }

  async getById(id: string): Promise<Event> {
    const event = await this.repository.findById(id);
    if (!event) throw new HttpError(404, "Event not found");
    return event;
  }

  async list(): Promise<Event[]> {
    return this.repository.list();
  }

  async create(input: CreateEventInput): Promise<Event> {
    if (!input.name?.trim()) throw new HttpError(400, "Name is required");
    validateDuration(input.durationMinutes);
    return this.repository.create(input);
  }

  async update(id: string, input: UpdateEventInput): Promise<Event> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new HttpError(404, "Event not found");
    if (input.startsAt !== undefined && input.startsAt !== null)
      validateStartsAt(input.startsAt);
    if (input.durationMinutes !== undefined) validateDuration(input.durationMinutes);
    // starts_at is nullable only for draft events (DB-enforced) - leaving
    // draft without a start time would violate that, so use /start instead.
    const nextStatus = input.status ?? existing.status;
    const nextStartsAt = input.startsAt !== undefined ? input.startsAt : existing.startsAt;
    if (nextStatus !== "draft" && !nextStartsAt) {
      throw new HttpError(
        400,
        "Use POST /admin/events/:id/start to move an event out of draft"
      );
    }

    let patch = input;
    if (nextStatus === "ended" && existing.status !== "ended") {
      const nowMs = Date.now();
      const scheduledEndMs = existing.endsAt ? Date.parse(existing.endsAt) : nowMs;
      patch = {
        ...input,
        endsAt: new Date(Math.min(scheduledEndMs, nowMs)).toISOString(),
        pausedAt: null,
      };
    }

    const updated = await this.repository.update(id, patch);
    if (!updated) throw new HttpError(404, "Event not found");
    if (input.status !== undefined && input.status !== existing.status) {
      this.broadcastStatus(updated);
    }
    return updated;
  }

  /** Start a draft event at a scheduled (future) time. Requires the number of
   * questions added to exactly match the event's configured question count. */
  async start(id: string, startsAt: string): Promise<Event> {
    const event = await this.repository.findById(id);
    if (!event) throw new HttpError(404, "Event not found");
    if (event.status !== "draft") throw new HttpError(400, "Only draft events can be started");
    validateStartsAt(startsAt);

    const questionCount = (await this.questions?.countForEvent(id)) ?? 0;
    if (questionCount !== event.questionCount) {
      throw new HttpError(
        400,
        `Add ${event.questionCount} question(s) to match the configured question count before starting (currently ${questionCount})`
      );
    }

    const endsAt = new Date(
      Date.parse(startsAt) + event.durationMinutes * 60_000
    ).toISOString();
    const updated = await this.repository.update(id, {
      startsAt,
      endsAt,
      pausedAt: null,
      status: "active",
    });
    if (!updated) throw new HttpError(404, "Event not found");
    this.broadcastStatus(updated);
    return updated;
  }

  /** Freeze the live timer. Remaining time is `endsAt - pausedAt`. */
  async pause(id: string): Promise<Event> {
    const event = await this.requireActive(id);
    if (event.pausedAt) throw new HttpError(400, "Event is already paused");
    const updated = await this.repository.update(id, {
      pausedAt: new Date().toISOString(),
    });
    if (!updated) throw new HttpError(404, "Event not found");
    this.broadcastStatus(updated);
    return updated;
  }

  /** Resume a paused timer, shifting endsAt forward by the paused duration. */
  async resume(id: string): Promise<Event> {
    const event = await this.requireActive(id);
    if (!event.pausedAt) throw new HttpError(400, "Event isn't paused");
    if (!event.endsAt) throw new HttpError(400, "Event has no timer");
    const pausedMs = Date.now() - Date.parse(event.pausedAt);
    const endsAt = new Date(Date.parse(event.endsAt) + pausedMs).toISOString();
    const updated = await this.repository.update(id, {
      endsAt,
      pausedAt: null,
    });
    if (!updated) throw new HttpError(404, "Event not found");
    this.broadcastStatus(updated);
    return updated;
  }

  private async requireActive(id: string): Promise<Event> {
    const event = await this.repository.findById(id);
    if (!event) throw new HttpError(404, "Event not found");
    if (event.status !== "active") throw new HttpError(400, "Event isn't active");
    return event;
  }

  private broadcastStatus(event: Event) {
    this.hub?.publish(event.id, {
      type: "event_status",
      eventId: event.id,
      status: event.status,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      pausedAt: event.pausedAt,
    });
  }

  /** Live join/progress counters for the admin overview. */
  async getStats(id: string): Promise<EventStats> {
    const event = await this.repository.findById(id);
    if (!event) throw new HttpError(404, "Event not found");
    return this.repository.stats(id);
  }
}

export { HttpError };
