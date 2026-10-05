import type { Event, Team } from "@dsc-hunt/types";
import { EventsRepository } from "../events/events.repository";
import { TeamsRepository } from "../teams/teams.repository";

export class MeRepository {
  constructor(
    private readonly events = new EventsRepository(),
    private readonly teams = new TeamsRepository()
  ) {}

  async getCurrentEvent(): Promise<Event | null> {
    return this.events.findCurrent();
  }

  async getTeamForUser(userId: string, eventId: string): Promise<Team | null> {
    return this.teams.getTeamForUser(userId, eventId);
  }
}
