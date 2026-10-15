export { pool } from "./postgres";

import { pool } from "./postgres";

/**
 * Run a parameterized query and return the rows. Use positional `$1`, `$2`
 * placeholders - never interpolate values into the query string.
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
