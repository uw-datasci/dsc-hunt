import type { FastifyReply, FastifyRequest } from "fastify"
import { SystemService } from "./system.service"

export class SystemController {
  constructor(private readonly service: SystemService) {
    this.getHealth = this.getHealth.bind(this)
    this.getWelcome = this.getWelcome.bind(this)
  }

  getHealth(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(this.service.getHealth())
  }

  getWelcome(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(this.service.getWelcomeMessage())
  }
}
