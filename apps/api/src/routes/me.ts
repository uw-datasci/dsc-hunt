import type { FastifyPluginAsync } from "fastify";

import { MeController } from "../modules/me/me.controller";
import { meSchema } from "../modules/me/me.schema";

const meRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new MeController();

  fastify.get("/me", { schema: meSchema.get, preHandler: fastify.requireAuth }, controller.get);
};

export default meRoutes;
