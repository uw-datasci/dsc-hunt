/**
 * Central Fastify plugin registration.
 *
 * Plugins are applied in a fixed order: environment validation first (so later
 * plugins can read `fastify.config`), then helmet, CORS, auth (decorates
 * request.user / provides require* guards) - which must precede rate limiting
 * so its keyGenerator can key on the authenticated user rather than IP -
 * then rate limiting, the realtime hub (SSE fan-out), and finally OpenAPI
 * docs in non-production only.
 */
import type { FastifyInstance } from "fastify";

import { registerAuth } from "./auth";
import { registerCors } from "./cors";
import { registerEnv } from "./env";
import { registerHelmet } from "./helmet";
import { registerRateLimit } from "./rate-limit";
import { registerRealtime } from "./realtime";
import { registerSwagger } from "./swagger";

export async function registerPlugins(fastify: FastifyInstance) {
  await registerEnv(fastify);
  await registerHelmet(fastify);
  await registerCors(fastify);
  await registerAuth(fastify);
  await registerRateLimit(fastify);
  await registerRealtime(fastify);
  // Insert new plugins here

  if (fastify.config.NODE_ENV !== "production") await registerSwagger(fastify);
}
