import { Pool } from "@neondatabase/serverless";

let _pool: Pool | null = null;

/**
 * Fail fast instead of hanging: a request that can't get a connection errors
 * out well before the web app gives up on the API (10s), so players get a
 * clear error instead of a frozen screen. Enforced by the client, so it works
 * through Neon's pooler. (Statement timeouts live in `withTransaction`: the
 * pooler ignores session settings like `statement_timeout`.)
 */
const CONNECTION_TIMEOUT_MS = 5_000;

/**
 * Lazy singleton: we don't instantiate the Pool at module load because
 * `process.env.DATABASE_URL` may not be populated yet (Fastify loads its
 * .env via `@fastify/env` after module evaluation).
 */
export function getPool(): Pool {
  if (_pool) return _pool;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  _pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  });
  return _pool;
}

/**
 * Proxy so callers can keep importing `pool` and treat it like a Pool;
 * the real connection isn't opened until the first query.
 */
export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const target = getPool() as unknown as Record<string | symbol, unknown>;
    const value = target[prop];
    return typeof value === "function" ? value.bind(target) : value;
  },
});
