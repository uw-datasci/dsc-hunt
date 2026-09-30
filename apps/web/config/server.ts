import "server-only";

type ServerConfig = {
  readonly databaseUrl: string;
  readonly supabaseUrl: string;
  readonly supabasePublishableKey: string;
};

/**
 * Returns a trimmed, non-empty `process.env` value. Use in `config/client.ts`,
 * `config/server.ts`, or other config modules - not scattered across the app.
 */
function requireEnv(name: string): string {
  const raw = process.env[name]?.trim();
  if (!raw) throw new Error(`Missing required environment variable: ${name}`);

  return raw;
}

/**
 * Server-only environment variables.
 *
 * Usage:
 * 1. Add the variable to `.env` / your secrets manager (e.g. Infisical).
 * 2. Add a typed getter below using `requireEnv`.
 * 3. Import `serverConfig` in Server Components, Route Handlers, Server Actions,
 *    and middleware. Do not import this file from client components.
 *
 * Values are read lazily so `next build` and `proxy.ts` can load modules
 * without requiring every env var at import time.
 */
export const serverConfig: ServerConfig = {
  get databaseUrl() {
    return requireEnv("DATABASE_URL");
  },
  get supabaseUrl() {
    return requireEnv("SUPABASE_URL");
  },
  get supabasePublishableKey() {
    return requireEnv("SUPABASE_PUBLISHABLE_KEY");
  },
};
