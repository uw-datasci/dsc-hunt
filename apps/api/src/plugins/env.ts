/**
 * Environment configuration via `@fastify/env`.
 *
 * Loads variables from `.env.local` / `.env` (when present) and validates them against a JSON
 * schema. Exposes the result on `fastify.config` under the key `config`, so
 * routes and other plugins can read `NODE_ENV`, `PORT`, `HOST`, `CORS_ORIGIN`,
 * and the Supabase settings with defaults applied for missing values.
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
    SUPABASE_URL: { type: "string", default: "" },
    SUPABASE_PUBLISHABLE_KEY: { type: "string", default: "" },
  },
} as const

export async function registerEnv(fastify: FastifyInstance) {
  await fastify.register(fastifyEnv, {
    confKey: "config",
    schema,
    // `pnpm pull-secrets` writes `.env.local`; `.env` is a manual fallback.
    // Earlier paths win, and real env vars (e.g. in Docker) win over both.
    dotenv: { path: [".env.local", ".env"], quiet: true },
  })
}
