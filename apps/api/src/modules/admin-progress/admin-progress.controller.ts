import type { FastifyReply, FastifyRequest } from "fastify";
import { handle } from "../../lib/http";
import type { AdminProgressService } from "./admin-progress.service";

export class AdminProgressController {
  constructor(private readonly service: AdminProgressService) {
    this.get = this.get.bind(this);
  }

  get(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    return handle(reply, () => this.service.get(request.params.id));
  }
}
