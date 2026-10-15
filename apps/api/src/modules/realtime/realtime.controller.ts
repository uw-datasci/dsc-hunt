import type { FastifyReply, FastifyRequest } from "fastify";
import type { EventsRepository } from "../events/events.repository";
import type { EventHub } from "./event-hub";

/**
 * Mirrors `plugins/cors.ts`: empty / `*` reflects any origin, otherwise the
 * origin must be in the comma-separated allowlist.
 */
function allowedOrigin(configured: string, origin: string | undefined): string | null {
  if (!origin) return null;
  const trimmed = configured.trim();
  if (trimmed === "" || trimmed === "*") return origin;
  const allowed = trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

export class RealtimeController {
  constructor(
    private readonly hub: EventHub,
    private readonly events: EventsRepository
  ) {
    this.stream = this.stream.bind(this);
  }

  async stream(request: FastifyRequest, reply: FastifyReply) {
    const { id: eventId } = request.params as { id: string };
    if (!request.user) return reply.code(401).send({ error: "Unauthenticated" });

    const event = await this.events.findById(eventId);
    if (!event) return reply.code(404).send({ error: "Event not found" });

    // Hijack skips Fastify onSend hooks, so @fastify/cors never writes headers.
    // EventSource is cross-origin from the web app and needs them on the raw response.
    reply.hijack();
    const origin = allowedOrigin(request.server.config.CORS_ORIGIN, request.headers.origin);
    if (origin) {
      reply.raw.setHeader("Access-Control-Allow-Origin", origin);
      reply.raw.setHeader("Vary", "Origin");
    }
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.setHeader("X-Accel-Buffering", "no");
    reply.raw.flushHeaders();

    this.hub.subscribe(eventId, reply);

    // Snapshot the current status immediately so a client that just
    // (re)connected - e.g. after a dropped wifi connection - self-heals to
    // the true state instead of waiting for the next admin action.
    this.hub.send(eventId, reply, { type: "event_status", eventId, status: event.status });
  }
}
