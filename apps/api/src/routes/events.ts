import type { FastifyPluginAsync } from "fastify";

import { EventsController } from "../modules/events/events.controller";
import { EventsRepository } from "../modules/events/events.repository";
import { eventsSchema } from "../modules/events/events.schema";
import { EventsService } from "../modules/events/events.service";

const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new EventsRepository();
  const service = new EventsService(repository, fastify.eventHub);
  const controller = new EventsController(service);

  // Any signed-in player can read status; it gates the home page and /riddles.
  fastify.get(
    "/events/current",
    { schema: eventsSchema.getCurrent, preHandler: fastify.requireAuth },
    controller.getCurrent
  );
  fastify.get(
    "/events/:id",
    { schema: eventsSchema.getById, preHandler: fastify.requireAuth },
    controller.getById
  );

  // Lifecycle - staff only. Transitions are one-way; anything else is a 409.
  fastify.post(
    "/events/:id/start",
    { schema: eventsSchema.start, preHandler: fastify.requireAdmin },
    controller.start
  );
  fastify.post(
    "/events/:id/end",
    { schema: eventsSchema.end, preHandler: fastify.requireAdmin },
    controller.end
  );
};

export default eventsRoutes;
