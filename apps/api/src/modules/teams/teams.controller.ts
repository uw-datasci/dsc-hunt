import type { FastifyReply, FastifyRequest } from "fastify";
import { handle } from "../../lib/http";
import type { TeamsService } from "./teams.service";
import type { CreateTeamBody, EventParams, JoinParams, TeamParams } from "./teams.types";

export class TeamsController {
  constructor(private readonly service: TeamsService) {
    this.create = this.create.bind(this);
    this.join = this.join.bind(this);
    this.getMine = this.getMine.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.leave = this.leave.bind(this);
  }

  create(
    request: FastifyRequest<{ Params: EventParams; Body: CreateTeamBody | undefined }>,
    reply: FastifyReply
  ) {
    return handle(
      reply,
      async () => ({
        team: await this.service.create(request.params.id, request.user!, request.body?.name),
      }),
      201
    );
  }

  join(request: FastifyRequest<{ Params: JoinParams }>, reply: FastifyReply) {
    const { id, code } = request.params;
    return handle(reply, async () => ({
      team: await this.service.joinByCode(id, code, request.user!),
    }));
  }

  getMine(request: FastifyRequest<{ Params: EventParams }>, reply: FastifyReply) {
    return handle(reply, async () => ({
      team: await this.service.getMine(request.params.id, request.user!.id),
    }));
  }

  getDetail(request: FastifyRequest<{ Params: TeamParams }>, reply: FastifyReply) {
    return handle(reply, () => this.service.getDetail(request.params.id, request.user!));
  }

  leave(request: FastifyRequest<{ Params: TeamParams }>, reply: FastifyReply) {
    return handle(reply, () => this.service.leave(request.params.id, request.user!.id), 204);
  }
}
