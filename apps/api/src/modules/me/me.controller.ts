import type { FastifyReply, FastifyRequest } from "fastify"

export class MeController {
  constructor() {
    this.get = this.get.bind(this)
  }

  get(request: FastifyRequest, reply: FastifyReply) {
    // requireAuth preHandler guarantees request.user is set
    return reply.send({ user: request.user! })
  }
}
