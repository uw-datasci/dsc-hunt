/**
 * In-process SSE fan-out. Decorates `fastify.eventHub` so services can
 * broadcast to every client subscribed to an event (see `modules/realtime`).
 * One hub per Fastify process - a multi-instance deploy would need a shared
 * broker (same caveat as `profile-cache.ts`).
 */
import type { FastifyInstance } from "fastify";
import { EventHub } from "../modules/realtime/event-hub";

export async function registerRealtime(fastify: FastifyInstance) {
  const hub = new EventHub();
  fastify.decorate("eventHub", hub);
  fastify.addHook("onClose", async () => hub.dispose());
}
