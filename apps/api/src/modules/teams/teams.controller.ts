import type { FastifyReply, FastifyRequest } from "fastify";
import { handle } from "../../lib/http";
import type { TeamsService } from "./teams.service";
import type {
  AdminMemberParams,
  AdminTeamParams,
  CreateTeamBody,
  EventParams,
  JoinParams,
  RenameTeamBody,
  TeamParams,
} from "./teams.types";

export class TeamsController {
  constructor(private readonly service: TeamsService) {
    this.create = this.create.bind(this);
    this.join = this.join.bind(this);
    this.getMine = this.getMine.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.leave = this.leave.bind(this);
    this.listForAdmin = this.listForAdmin.bind(this);
    this.adminRename = this.adminRename.bind(this);
    this.adminDeleteTeam = this.adminDeleteTeam.bind(this);
    this.adminRemoveMember = this.adminRemoveMember.bind(this);
  }

  listForAdmin(request: FastifyRequest<{ Params: EventParams }>, reply: FastifyReply) {
    return handle(reply, async () => ({
      teams: await this.service.listForAdmin(request.params.id),
    }));
  }

  adminRename(
    request: FastifyRequest<{ Params: AdminTeamParams; Body: RenameTeamBody }>,
    reply: FastifyReply
  ) {
    const { id, teamId } = request.params;
    return handle(reply, async () => ({
      team: await this.service.adminRename(id, teamId, request.body.name),
    }));
  }

  adminDeleteTeam(request: FastifyRequest<{ Params: AdminTeamParams }>, reply: FastifyReply) {
    const { id, teamId } = request.params;
    return handle(reply, () => this.service.adminDeleteTeam(id, teamId), 204);
  }

  adminRemoveMember(
    request: FastifyRequest<{ Params: AdminMemberParams }>,
    reply: FastifyReply
  ) {
    const { id, teamId, userId } = request.params;
    return handle(reply, () => this.service.adminRemoveMember(id, teamId, userId), 204);
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
