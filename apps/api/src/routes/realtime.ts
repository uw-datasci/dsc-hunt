import type { FastifyPluginAsync } from "fastify";

import { EventsRepository } from "../modules/events/events.repository";
import { RealtimeController } from "../modules/realtime/realtime.controller";
import { realtimeSchema } from "../modules/realtime/realtime.schema";
import { TeamsRepository } from "../modules/teams/teams.repository";

const realtimeRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new RealtimeController(
    fastify.eventHub,
    new EventsRepository(),
    new TeamsRepository()
  );

  fastify.get(
    "/events/:id/stream",
    // No requireAuth: the public leaderboard streams logged out. The auth hook
    // still identifies signed-in players from `?access_token=`.
    { schema: realtimeSchema.stream },
    controller.stream
  );
};

export default realtimeRoutes;
