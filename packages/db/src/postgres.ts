import { Pool } from "@neondatabase/serverless";

let _pool: Pool | null = null;

/**
 * Lazy singleton: we don't instantiate the Pool at module load because
 * `process.env.DATABASE_URL` may not be populated yet (Fastify loads its
 * .env via `@fastify/env` after module evaluation).
 */
export function getPool(): Pool {
  if (_pool) return _pool;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  _pool = new Pool({ connectionString: databaseUrl });
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
