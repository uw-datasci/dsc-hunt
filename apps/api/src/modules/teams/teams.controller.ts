import type { FastifyReply, FastifyRequest } from "fastify";
import { TeamsService } from "./teams.service";
import { HttpError } from "../events/events.service";
import type { CreateTeamInput } from "./teams.types";

async function handle<T>(reply: FastifyReply, fn: () => Promise<T>, okCode = 200) {
  try {
    const result = await fn();
    return reply.code(okCode).send(result);
  } catch (err) {
    if (err instanceof HttpError) {
      return reply.code(err.statusCode).send({ error: err.message });
    }
    throw err;
  }
}

export class TeamsController {
  constructor(private readonly service: TeamsService) {
    this.create = this.create.bind(this);
    this.join = this.join.bind(this);
    this.leave = this.leave.bind(this);
    this.getDetail = this.getDetail.bind(this);
    this.listForEventAdmin = this.listForEventAdmin.bind(this);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const { id: eventId } = request.params as { id: string };
    const body = (request.body ?? {}) as CreateTeamInput;
    const user = request.user!;
    return handle(reply, () => this.service.create(eventId, user.id, body), 201);
  }

  async join(request: FastifyRequest, reply: FastifyReply) {
    const { eventId, code } = request.params as {
      eventId: string;
      code: string;
    };
    const user = request.user!;
    return handle(reply, () => this.service.joinByCode(eventId, code, user.id));
  }

  async leave(request: FastifyRequest, reply: FastifyReply) {
    const { id: teamId } = request.params as { id: string };
    const user = request.user!;
    return handle(reply, async () => {
      await this.service.leave(teamId, user.id);
      return { ok: true };
    });
  }

  async getDetail(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    return handle(reply, () => this.service.getDetail(id));
  }

  async listForEventAdmin(request: FastifyRequest, reply: FastifyReply) {
    const { id: eventId } = request.params as { id: string };
    return handle(reply, async () => {
      const teams = await this.service.listForEventAdmin(eventId);
      return { teams };
    });
  }
}
