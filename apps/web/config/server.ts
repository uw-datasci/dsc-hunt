import "server-only";

/**
 * Server-only environment variables.
 *
 * Usage:
 * 1. Add the variable to `.env` / your secrets manager (e.g. Infisical).
 * 2. Add a typed field below using `requireEnv`.
 * 3. Import `serverConfig` in Server Components, Route Handlers, Server Actions,
 *    and `server/` domain code. Do not import this file from client components.
 */

function requireEnv(name: string): string {
  const raw = process.env[name]?.trim();
  if (!raw) throw new Error(`Missing required environment variable: ${name}`);

  return raw;
}

export const serverConfig = {
  // databaseUrl: requireEnv("DATABASE_URL"),
  // apiSecret: requireEnv("API_SECRET"),
} as const;
