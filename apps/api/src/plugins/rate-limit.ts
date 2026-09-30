/**
 * Request rate limiting via `@fastify/rate-limit`.
 *
 * Caps traffic at 100 requests per minute, keyed on the authenticated user
 * (set by the auth plugin's `onRequest` hook, which must be registered before
 * this plugin - see `plugins/index.ts`), falling back to IP for
 * unauthenticated requests. `/health` is excluded so liveness probes are not
 * throttled.
 */
import rateLimit from "@fastify/rate-limit"
import type { FastifyInstance, FastifyRequest } from "fastify"

function pathOnly(url: string): string {
  const q = url.indexOf("?")
  return q === -1 ? url : url.slice(0, q)
}

const RATE_LIMIT_SKIP_PATHS = new Set(["/health"])

export async function registerRateLimit(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: 100, // Maximum number of requests per time window, per user
    timeWindow: "1 minute", // Time window for rate limiting
    keyGenerator: (req: FastifyRequest) => req.user?.id ?? req.ip,
    allowList: (req: FastifyRequest) =>
      RATE_LIMIT_SKIP_PATHS.has(pathOnly(req.url)),
  })
}
