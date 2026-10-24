import type { FastifyReply, FastifyRequest } from "fastify";
import { handle } from "../../lib/http";
import type { LeaderboardService } from "./leaderboard.service";

export class LeaderboardController {
  constructor(private readonly service: LeaderboardService) {
    this.getForEvent = this.getForEvent.bind(this);
  }

  getForEvent(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    return handle(reply, async () => ({ leaderboard: await this.service.getForEvent(id) }));
  }
}
