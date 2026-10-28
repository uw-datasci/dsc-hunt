import type { FastifyReply, FastifyRequest } from "fastify";
import { handle } from "../../lib/http";
import type { AdminRiddlesService } from "./admin-riddles.service";
import type { RiddleParams, SaveRiddleBody } from "./admin-riddles.types";

export class AdminRiddlesController {
  constructor(private readonly service: AdminRiddlesService) {
    this.list = this.list.bind(this);
    this.save = this.save.bind(this);
    this.regenerateQr = this.regenerateQr.bind(this);
  }

  list(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    return handle(reply, async () => ({ riddles: await this.service.list(request.params.id) }));
  }

  save(
    request: FastifyRequest<{ Params: RiddleParams; Body: SaveRiddleBody }>,
    reply: FastifyReply
  ) {
    const { id, position } = request.params;
    return handle(reply, async () => ({
      riddle: await this.service.save(id, position, request.body),
    }));
  }

  regenerateQr(request: FastifyRequest<{ Params: RiddleParams }>, reply: FastifyReply) {
    const { id, position } = request.params;
    return handle(reply, () => this.service.regenerateQr(id, position));
  }
}
