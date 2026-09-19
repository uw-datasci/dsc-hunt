/**
 * Client-safe environment variables (exposed to the browser).
 *
 * Usage:
 * 1. Define variables in `.env` with the `NEXT_PUBLIC_` prefix. Only these are inlined into the client bundle at build time.
 * 2. Add a typed field below using `requireEnv`.
 * 3. Import `clientConfig` from Client Components and shared client code.
 *    Never put secrets here — anything in this file is visible in the browser.
 */

function requireEnv(name: string): string {
  const raw = process.env[name]?.trim();
  if (!raw) throw new Error(`Missing required environment variable: ${name}`);

  return raw;
}

export const clientConfig = {
  // appUrl: requireEnv("NEXT_PUBLIC_APP_URL"),
} as const;
