import type { FastifyPluginAsync } from "fastify";

import { AdminRiddlesController } from "../modules/admin-riddles/admin-riddles.controller";
import { AdminRiddlesRepository } from "../modules/admin-riddles/admin-riddles.repository";
import { adminRiddlesSchema } from "../modules/admin-riddles/admin-riddles.schema";
import { AdminRiddlesService } from "../modules/admin-riddles/admin-riddles.service";
import type {
  RiddleParams,
  SaveRiddleBody,
} from "../modules/admin-riddles/admin-riddles.types";
import { EventsRepository } from "../modules/events/events.repository";

const adminRiddlesRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new AdminRiddlesController(
    new AdminRiddlesService(new AdminRiddlesRepository(), new EventsRepository())
  );
  const admin = fastify.requireAdmin;

  fastify.get<{ Params: { id: string } }>(
    "/events/:id/admin/riddles",
    { schema: adminRiddlesSchema.list, preHandler: admin },
    controller.list
  );
  fastify.put<{ Params: RiddleParams; Body: SaveRiddleBody }>(
    "/events/:id/admin/riddles/:position",
    { schema: adminRiddlesSchema.save, preHandler: admin },
    controller.save
  );
  fastify.post<{ Params: RiddleParams }>(
    "/events/:id/admin/riddles/:position/regenerate-qr",
    { schema: adminRiddlesSchema.regenerateQr, preHandler: admin },
    controller.regenerateQr
  );
};

export default adminRiddlesRoutes;
