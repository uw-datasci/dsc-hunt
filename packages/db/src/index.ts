export { pool } from "./postgres";

import { pool } from "./postgres";

/**
 * Longest any statement in a transaction may run, including waiting on a row
 * lock (`FOR UPDATE`). Set with `SET LOCAL` per transaction, because Neon's
 * pooler (transaction mode) ignores session-level settings.
 */
const TRANSACTION_STATEMENT_TIMEOUT = "5s";

export interface DatabaseTransaction {
  query<T>(text: string, params?: ReadonlyArray<unknown>): Promise<T[]>;
  afterCommit(callback: () => void): void;
}

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

/**
 * Run work in a database transaction and invoke registered callbacks only
 * after the transaction has committed successfully.
 */
export async function withTransaction<T>(
  callback: (transaction: DatabaseTransaction) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  const afterCommit: Array<() => void> = [];
  const transaction: DatabaseTransaction = {
    async query<T>(text: string, params?: ReadonlyArray<unknown>): Promise<T[]> {
      const result = await client.query(text, params as unknown[]);
      return result.rows as T[];
    },
    afterCommit(callback) {
      afterCommit.push(callback);
    },
  };
  let committed = false;

  try {
    await client.query("BEGIN");
    await client.query(`SET LOCAL statement_timeout = '${TRANSACTION_STATEMENT_TIMEOUT}'`);
    const result = await callback(transaction);
    await client.query("COMMIT");
    committed = true;
    for (const publish of afterCommit) publish();
    return result;
  } catch (error) {
    if (!committed) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          "Transaction failed and rollback also failed"
        );
      }
    }
    throw error;
  } finally {
    client.release();
  }
}
