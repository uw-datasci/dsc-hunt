import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serverConfig } from "@/config/server";

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 *
 * Reads the session cookie set by the main club site at `Domain=.uwdatascience.ca`.
 * We never sign users in here - the main site at www.uwdatascience.ca owns
 * the login flow. Cookie writes are silently swallowed inside Server
 * Components because Next.js doesn't allow mutating cookies during render;
 * the middleware (proxy.ts) is what actually refreshes tokens.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(serverConfig.supabaseUrl, serverConfig.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options as CookieOptions);
          }
        } catch {
          // Called from a Server Component - middleware refreshes instead.
        }
      },
    },
  });
}
