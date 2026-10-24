import type { LeaderboardEntry } from "@dsc-hunt/types";
import { HttpError } from "../../lib/http-error";
import type { EventsRepository } from "../events/events.repository";
import type { LeaderboardRepository } from "./leaderboard.repository";

export class LeaderboardService {
  constructor(
    private readonly repository: LeaderboardRepository,
    private readonly events: EventsRepository
  ) {}

  async getForEvent(eventId: string): Promise<LeaderboardEntry[]> {
    const event = await this.events.findById(eventId);
    if (!event) throw new HttpError(404, "Event not found");

    const rows = await this.repository.listForEvent(eventId);
    return rows.map((row, index) => ({
      rank: index + 1,
      teamId: row.team_id,
      name: row.team_name,
      totalScore: row.total_score,
    }));
  }
}
