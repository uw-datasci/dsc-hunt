import type { FastifyReply, FastifyRequest } from "fastify";
import { MeService } from "./me.service";

export class MeController {
  constructor(private readonly service: MeService) {
    this.get = this.get.bind(this);
  }

  async get(request: FastifyRequest, reply: FastifyReply) {
    // requireAuth preHandler guarantees request.user is set
    const user = request.user!;
    const me = await this.service.get(user.id);
    return reply.send({ ...me, user });
  }
}
