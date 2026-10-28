import "server-only";

import { clientConfig } from "@/config/client";
import { getRequestOrigin } from "@/lib/request-origin";

/**
 * `returnTo` is a path on this site. Defaults to the landing page, which
 * self-routes signed-in users to the right game screen. Resolved against
 * the request's own host, not the main site's, so the `redirect` param
 * sends the user back here instead of stranding them on the main site.
 */
export async function buildLoginUrl(returnTo = "/"): Promise<string> {
  const loginUrl = new URL("/login", clientConfig.mainSiteUrl);
  loginUrl.searchParams.set("redirect", new URL(returnTo, await getRequestOrigin()).toString());
  return loginUrl.toString();
}
