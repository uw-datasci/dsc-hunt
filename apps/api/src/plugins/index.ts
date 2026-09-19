/**
 * Central Fastify plugin registration.
 *
 * Plugins are applied in a fixed order: environment validation first (so later
 * plugins can read `fastify.config`), then helmet, CORS, rate limiting, and
 * finally OpenAPI docs in non-production only.
 */
import type { FastifyInstance } from "fastify"

import { registerCors } from "./cors"
import { registerEnv } from "./env"
import { registerHelmet } from "./helmet"
import { registerRateLimit } from "./rate-limit"
import { registerSwagger } from "./swagger"

export async function registerPlugins(fastify: FastifyInstance) {
  await registerEnv(fastify)
  await registerHelmet(fastify)
  await registerCors(fastify)
  await registerRateLimit(fastify)
  // Insert new plugins here

  if (fastify.config.NODE_ENV !== "production") await registerSwagger(fastify)
}
