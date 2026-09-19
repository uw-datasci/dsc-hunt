/**
 * Security-related HTTP headers via `@fastify/helmet`.
 *
 * In non-production, `contentSecurityPolicy` is disabled to avoid friction with
 * local tooling (e.g. Swagger UI).
 */
import helmet from "@fastify/helmet"
import type { FastifyInstance } from "fastify"

export async function registerHelmet(fastify: FastifyInstance) {
  await fastify.register(
    helmet,
    fastify.config.NODE_ENV === "production"
      ? {}
      : { contentSecurityPolicy: false },
  )
}
