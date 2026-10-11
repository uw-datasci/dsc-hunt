import type { FastifyReply } from "fastify";
import type { ServerMessage } from "@dsc-hunt/types";

const HEARTBEAT_MS = 25_000;

/**
 * In-memory pub/sub for SSE clients keyed by event id.
 * One hub per Fastify instance.
 */
export class EventHub {
  private readonly subscribers = new Map<string, Set<FastifyReply>>();
  private readonly heartbeats = new Map<FastifyReply, ReturnType<typeof setInterval>>();

  subscribe(eventId: string, reply: FastifyReply) {
    let set = this.subscribers.get(eventId);
    if (!set) {
      set = new Set();
      this.subscribers.set(eventId, set);
    }
    set.add(reply);

    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(": ping\n\n");
      } catch {
        this.unsubscribe(eventId, reply);
      }
    }, HEARTBEAT_MS);
    this.heartbeats.set(reply, heartbeat);

    reply.raw.on("close", () => this.unsubscribe(eventId, reply));
  }

  unsubscribe(eventId: string, reply: FastifyReply) {
    this.subscribers.get(eventId)?.delete(reply);
    const timer = this.heartbeats.get(reply);
    if (timer) clearInterval(timer);
    this.heartbeats.delete(reply);
  }

  publish(eventId: string, message: ServerMessage) {
    const set = this.subscribers.get(eventId);
    if (!set?.size) return;
    for (const reply of [...set]) {
      this.send(eventId, reply, message);
    }
  }

  /** Write a single message to one subscriber - used for the connect-time snapshot. */
  send(eventId: string, reply: FastifyReply, message: ServerMessage) {
    try {
      reply.raw.write(`data: ${JSON.stringify(message)}\n\n`);
    } catch {
      this.unsubscribe(eventId, reply);
    }
  }
}
