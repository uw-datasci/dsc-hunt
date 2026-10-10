import type { FastifyReply, FastifyRequest } from "fastify";

import { HttpError } from "../events/events.service";
import { LeaderboardService } from "./leaderboard.service";

async function handle<T>(reply: FastifyReply, fn: () => Promise<T>) {
  try {
    return reply.send(await fn());
  } catch (err) {
    if (err instanceof HttpError) {
      return reply.code(err.statusCode).send({ error: err.message });
    }
    throw err;
  }
}

export class LeaderboardController {
  constructor(private readonly service: LeaderboardService) {
    this.getForEvent = this.getForEvent.bind(this);
  }

  async getForEvent(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    return handle(reply, async () => {
      const leaderboard = await this.service.getLeaderboard(id);
      return { leaderboard };
    });
  }
}
