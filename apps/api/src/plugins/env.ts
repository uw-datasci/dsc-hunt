/**
 * Environment configuration via `@fastify/env`.
 *
 * Loads variables from `.env.local` / `.env` (when present) and validates them against a JSON
 * schema. Exposes the result on `fastify.config` under the key `config`, so
 * routes and other plugins can read `NODE_ENV`, `PORT`, `HOST`, `CORS_ORIGIN`,
 * `DATABASE_URL`, and the Supabase settings with defaults applied for missing
 * values. `@dsc-hunt/db` reads `DATABASE_URL` from `process.env`, which the
 * dotenv step here populates before the first query runs.
 */
import type { FastifyInstance } from "fastify";
import fastifyEnv from "@fastify/env";

const schema = {
  type: "object",
  properties: {
    NODE_ENV: { type: "string", default: "development" },
    PORT: { type: "string", default: "8000" },
    HOST: { type: "string", default: "localhost" },
    CORS_ORIGIN: { type: "string", default: "" },
    SUPABASE_URL: { type: "string", default: "" },
    SUPABASE_PUBLISHABLE_KEY: { type: "string", default: "" },
    DATABASE_URL: { type: "string", default: "" },
    // Neon Object Storage (S3-compatible) for riddle images. The four AWS_*
    // names are exactly what Neon's generated .env uses (and what the AWS SDK
    // reads); S3_BUCKET is ours. Optional: image routes return 503 until all
    // five are set. See .env.example.
    AWS_ENDPOINT_URL_S3: { type: "string", default: "" },
    AWS_REGION: { type: "string", default: "" },
    AWS_ACCESS_KEY_ID: { type: "string", default: "" },
    AWS_SECRET_ACCESS_KEY: { type: "string", default: "" },
    S3_BUCKET: { type: "string", default: "" },
  },
} as const;

export async function registerEnv(fastify: FastifyInstance) {
  await fastify.register(fastifyEnv, {
    confKey: "config",
    schema,
    // `pnpm pull-secrets` writes `.env.local`; `.env` is a manual fallback.
    // Earlier paths win, and real env vars (e.g. in Docker) win over both.
    dotenv: { path: [".env.local", ".env"], quiet: true },
  });
}
