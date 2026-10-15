import type { FastifyReply, FastifyRequest } from "fastify";
import { HttpError } from "../../lib/http-error";
import type { EventsService } from "./events.service";

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

export class EventsController {
  constructor(private readonly service: EventsService) {
    this.getCurrent = this.getCurrent.bind(this);
    this.getById = this.getById.bind(this);
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
  }

  getCurrent(_request: FastifyRequest, reply: FastifyReply) {
    return handle(reply, async () => ({ event: await this.service.getCurrent() }));
  }

  getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    return handle(reply, async () => ({ event: await this.service.getById(id) }));
  }

  start(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    return handle(reply, async () => ({ event: await this.service.start(id) }));
  }

  end(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    return handle(reply, async () => ({ event: await this.service.end(id) }));
  }
}
