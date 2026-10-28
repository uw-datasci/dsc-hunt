import "server-only";

import { RaftResponse } from "@uw-datasci/raft";
import { NextResponse } from "next/server";

/**
 * Passes an API redirect (e.g. to a short-lived signed image URL) through to
 * the browser, so it fetches the target directly. Call `proxyApi` with
 * `redirect: "manual"`. Non-redirect answers are passed through as-is.
 */
export async function passThroughRedirect(upstream: Response): Promise<Response> {
  const location = upstream.headers.get("location");
  if (upstream.status >= 300 && upstream.status < 400 && location) {
    const response = NextResponse.redirect(location, upstream.status);
    const cacheControl = upstream.headers.get("cache-control");
    if (cacheControl) response.headers.set("Cache-Control", cacheControl);
    return response;
  }
  return RaftResponse.text(
    await upstream.text(),
    upstream.headers.get("content-type") ?? "application/json",
    upstream.status
  );
}
