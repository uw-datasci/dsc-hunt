import { NextResponse, type NextRequest } from "next/server";
import { PATHNAME_HEADER } from "@/lib/auth/return-path";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

/**
 * Next.js 16 proxy (middleware) - runs before every matched request.
 *
 * Responsibilities:
 * - Refresh the Supabase session cookie when it's near expiry.
 * - Pass the requested path to server components (`x-pathname`), so the
 *   (player) layout can send logged-out players back here after login.
 *
 * Route-level access control lives in the (player) / (admin) layouts, not
 * here, so we can render public pages (the marketing landing) without
 * redirecting.
 */
export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  // Always overwrite: a client-sent value must never be trusted.
  requestHeaders.set(PATHNAME_HEADER, request.nextUrl.pathname + request.nextUrl.search);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createSupabaseMiddlewareClient(request, response);
  // Calling getUser() is what triggers @supabase/ssr to rotate cookies on
  // the response when the token needs refreshing.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    // Match everything except static assets and Next internals.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
