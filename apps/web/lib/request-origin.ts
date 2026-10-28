import "server-only";

import { headers } from "next/headers";

/**
 * This site's origin as the browser sees it (e.g. `https://hunt.uwdsc.ca`),
 * honouring proxy headers. Used for absolute links back to this site: the
 * login `redirect` param and the URLs encoded in QR codes.
 */
export async function getRequestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${protocol}://${host}`;
}
