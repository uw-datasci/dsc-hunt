import type { FastifyPluginAsync } from "fastify";

import { EventsRepository } from "../modules/events/events.repository";
import { LeaderboardController } from "../modules/leaderboard/leaderboard.controller";
import { LeaderboardRepository } from "../modules/leaderboard/leaderboard.repository";
import { leaderboardSchema } from "../modules/leaderboard/leaderboard.schema";
import { LeaderboardService } from "../modules/leaderboard/leaderboard.service";

const leaderboardRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new LeaderboardService(new LeaderboardRepository(), new EventsRepository());
  const controller = new LeaderboardController(service);

  // Public: the leaderboard is projected at home base as well as viewed on phones.
  fastify.get(
    "/events/:id/leaderboard",
    { schema: leaderboardSchema.getForEvent },
    controller.getForEvent
  );
};

export default leaderboardRoutes;
