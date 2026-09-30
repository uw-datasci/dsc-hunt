type ClientConfig = {
  readonly apiUrl: string
  readonly mainSiteUrl: string
}

// Literal property access so Next.js can statically inline these into the
// client bundle at build time. Dynamic `process.env[name]` access (e.g. via a
// `requireEnv(name)` helper) is NOT inlined and resolves to `undefined` in the
// browser.
function readPublic(value: string | undefined, name: string): string {
  const v = value?.trim()
  if (!v) throw new Error(`Missing required environment variable: ${name}`)
  return v
}

/**
 * Public config (`NEXT_PUBLIC_*`). Safe in Client Components - use for API
 * proxying and login redirects. Never put secrets here - anything in this
 * file is visible in the browser. Supabase credentials live in
 * `config/server.ts` (server-only).
 *
 * Values are read lazily so `next build` can load route modules without requiring
 * every env var at import time (e.g. during "Collecting page data").
 */
export const clientConfig: ClientConfig = {
  get apiUrl() {
    return readPublic(process.env.NEXT_PUBLIC_API_URL, "NEXT_PUBLIC_API_URL")
  },
  get mainSiteUrl() {
    return readPublic(
      process.env.NEXT_PUBLIC_MAIN_SITE_URL,
      "NEXT_PUBLIC_MAIN_SITE_URL"
    )
  },
}
