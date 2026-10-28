import type { FastifyReply, FastifyRequest } from "fastify";
import { handle } from "../../lib/http";
import type { EventsService } from "./events.service";

export class EventsController {
  constructor(private readonly service: EventsService) {
    this.getCurrent = this.getCurrent.bind(this);
    this.getById = this.getById.bind(this);
    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
    this.setStartingLocation = this.setStartingLocation.bind(this);
    this.getStats = this.getStats.bind(this);
  }

  getStats(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    return handle(reply, async () => ({ stats: await this.service.getStats(id) }));
  }

  setStartingLocation(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { name, details } = request.body as { name: string; details?: string | null };
    return handle(reply, async () => ({
      event: await this.service.setStartingLocation(id, name, details),
    }));
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
