import type { FastifyPluginAsync } from "fastify";
import { MeController } from "../modules/me/me.controller";
import { MeService } from "../modules/me/me.service";
import { MeRepository } from "../modules/me/me.repository";
import { meSchema } from "../modules/me/me.schema";

const meRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new MeRepository();
  const service = new MeService(repository);
  const controller = new MeController(service);

  fastify.get("/me", {
    schema: meSchema.get,
    preHandler: fastify.requireAuth,
  }, controller.get);
};

export default meRoutes;