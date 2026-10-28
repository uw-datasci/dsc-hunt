import type { FastifyPluginAsync } from "fastify";

import { AdminProgressController } from "../modules/admin-progress/admin-progress.controller";
import { AdminProgressRepository } from "../modules/admin-progress/admin-progress.repository";
import { adminProgressSchema } from "../modules/admin-progress/admin-progress.schema";
import { AdminProgressService } from "../modules/admin-progress/admin-progress.service";
import { EventsRepository } from "../modules/events/events.repository";

const adminProgressRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new AdminProgressController(
    new AdminProgressService(new AdminProgressRepository(), new EventsRepository())
  );

  fastify.get<{ Params: { id: string } }>(
    "/events/:id/admin/progress",
    { schema: adminProgressSchema.get, preHandler: fastify.requireAdmin },
    controller.get
  );
};

export default adminProgressRoutes;
