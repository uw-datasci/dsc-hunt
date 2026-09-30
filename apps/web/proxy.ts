import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware"

/**
 * Next.js 16 proxy (middleware) - runs before every matched request.
 *
 * Responsibility: refresh the Supabase session cookie when it's near
 * expiry. Route-level access control lives in the (player) / (admin)
 * layouts, not here, so we can render public pages (the marketing
 * landing) without redirecting.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } })
  const supabase = createSupabaseMiddlewareClient(request, response)
  // Calling getUser() is what triggers @supabase/ssr to rotate cookies on
  // the response when the token needs refreshing.
  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: [
    // Match everything except static assets and Next internals.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
