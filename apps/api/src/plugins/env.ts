/**
 * Environment configuration via `@fastify/env`.
 *
 * Loads variables from `.env` (when present) and validates them against a JSON
 * schema. Exposes the result on `fastify.config` under the key `config`, so
 * routes and other plugins can read `NODE_ENV`, `PORT`, `HOST`, and
 * `CORS_ORIGIN` with defaults applied for missing values.
 */
import type { FastifyInstance } from "fastify"
import fastifyEnv from "@fastify/env"

const schema = {
  type: "object",
  properties: {
    NODE_ENV: { type: "string", default: "development" },
    PORT: { type: "string", default: "8000" },
    HOST: { type: "string", default: "localhost" },
    CORS_ORIGIN: { type: "string", default: "" },
  },
} as const

export async function registerEnv(fastify: FastifyInstance) {
  await fastify.register(fastifyEnv, {
    confKey: "config",
    schema,
    dotenv: true,
  })
}
