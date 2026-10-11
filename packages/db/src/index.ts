export { pool } from "./postgres.js";

import { pool } from "./postgres.js";

/**
 * Run a parameterized query and return the rows. Use template literals or
 * positional `$1`, `$2` placeholders - never interpolate values into the
 * query string.
 */
export async function query<T>(text: string, params?: ReadonlyArray<unknown>): Promise<T[]> {
  const result = await pool.query(text, params as unknown[]);
  return result.rows as T[];
}

/**
 * Run a query and return the first row, or null if there are none.
 */
export async function queryOne<T>(
  text: string,
  params?: ReadonlyArray<unknown>
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Run a series of statements in a single transaction. The callback receives
 * a client that supports `query`; commit/rollback are handled automatically.
 */
export async function transaction<T>(
  fn: (tx: {
    query: <U>(text: string, params?: ReadonlyArray<unknown>) => Promise<U[]>;
  }) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tx = {
      query: async <U>(text: string, params?: ReadonlyArray<unknown>) => {
        const result = await client.query(text, params as unknown[]);
        return result.rows as U[];
      },
    };
    const out = await fn(tx);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}