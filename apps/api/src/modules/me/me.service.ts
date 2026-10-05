import { MeRepository } from "./me.repository.js";
import type { MeRecord } from "./me.types";

export class MeService {
  constructor(private readonly repository: MeRepository) {}

  async get(userId: string): Promise<MeRecord> {
    const event = await this.repository.getCurrentEvent();
    const team = event ? await this.repository.getTeamForUser(userId, event.id) : null;
    return { userId, team, event };
  }
}
