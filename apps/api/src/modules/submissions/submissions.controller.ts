import type { FastifyReply, FastifyRequest } from "fastify";
import { SubmissionsService } from "./submissions.service";
import { HttpError } from "../events/events.service";
import type { CreateSubmissionInput } from "./submissions.types";

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

export class SubmissionsController {
  constructor(private readonly service: SubmissionsService) {
    this.submit = this.submit.bind(this);
    this.listForTeam = this.listForTeam.bind(this);
    this.score = this.score.bind(this);
  }

  async submit(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as CreateSubmissionInput;
    const user = request.user!;
    return handle(reply, () => this.service.submit(body, user.id), 201);
  }

  async listForTeam(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const user = request.user!;
    return handle(reply, async () => {
      const submissions = await this.service.listForTeam(id, user.id);
      return { submissions };
    });
  }

  async score(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    return handle(reply, () => this.service.getTeamScore(id));
  }
}
