import type { FastifyPluginAsync } from "fastify";

import { EventsRepository } from "../modules/events/events.repository";
import { RealtimeController } from "../modules/realtime/realtime.controller";
import { realtimeSchema } from "../modules/realtime/realtime.schema";

const realtimeRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new RealtimeController(fastify.eventHub, new EventsRepository());

  fastify.get(
    "/events/:id/stream",
    { schema: realtimeSchema.stream, preHandler: fastify.requireAuth },
    controller.stream
  );
};

export default realtimeRoutes;
