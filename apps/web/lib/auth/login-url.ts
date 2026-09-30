import "server-only";

import { headers } from "next/headers";
import { clientConfig } from "@/config/client";

/**
 * `returnTo` is a path on this site. Defaults to the landing page, which
 * self-routes signed-in users to the right game screen. Resolved against
 * the request's own host, not the main site's, so the `redirect` param
 * sends the user back here instead of stranding them on the main site.
 */
export async function buildLoginUrl(returnTo = "/"): Promise<string> {
  const loginUrl = new URL("/login", clientConfig.mainSiteUrl);
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  loginUrl.searchParams.set("redirect", new URL(returnTo, origin).toString());
  return loginUrl.toString();
}
