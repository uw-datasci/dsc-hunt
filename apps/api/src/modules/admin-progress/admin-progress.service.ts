import type { AdminProgressResponse } from "@dsc-hunt/types";
import { HttpError } from "../../lib/http-error";
import type { EventsRepository } from "../events/events.repository";
import type { AdminProgressRepository } from "./admin-progress.repository";

/** How many scans the live feed shows. */
export const RECENT_SCANS_LIMIT = 20;

export class AdminProgressService {
  constructor(
    private readonly repository: AdminProgressRepository,
    private readonly events: EventsRepository
  ) {}

  async get(eventId: string): Promise<AdminProgressResponse> {
    if (!(await this.events.findById(eventId))) throw new HttpError(404, "Event not found");
    const [teams, recentScans] = await Promise.all([
      this.repository.teams(eventId),
      this.repository.recentScans(eventId, RECENT_SCANS_LIMIT),
    ]);
    return { teams, recentScans };
  }
}
