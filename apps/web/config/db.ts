import "server-only";
import { neon } from "@neondatabase/serverless";

import { serverConfig } from "./server";

/**
 * Neon serverless SQL client.
 *
 * Backed by `DATABASE_URL` (see ./server). Use the tagged-template `sql` helper
 * from Server Components, Route Handlers, Server Actions, and server/ code.
 */
export const sql = neon(serverConfig.databaseUrl);
