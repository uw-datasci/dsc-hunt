import type { FastifyPluginAsync } from "fastify"

import { SystemController } from "../modules/system/system.controller"
import { SystemRepository } from "../modules/system/system.repository"
import { systemSchema } from "../modules/system/system.schema"
import { SystemService } from "../modules/system/system.service"

const systemRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new SystemRepository()
  const service = new SystemService(repository)
  const controller = new SystemController(service)

  fastify.get("/health", { schema: systemSchema.health }, controller.getHealth)

  fastify.get("/", { schema: systemSchema.welcome }, controller.getWelcome)
}

export default systemRoutes
