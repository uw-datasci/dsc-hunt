import "server-only";

import { RaftResponse } from "@uw-datasci/raft";
import type { NextResponse } from "next/server";
import { proxyApi } from "./proxy";

interface ForwardOptions {
  /** Body to send when the incoming request has none (Fastify rejects an empty JSON body). */
  emptyBody?: string;
  /** Extra fetch options for the upstream call, e.g. `cache: "no-store"`. */
  init?: Omit<RequestInit, "method" | "body" | "headers">;
}

/**
 * Forwards an incoming request to the Fastify API at `path`, keeping the
 * method, query string and body (read as bytes, so multipart uploads pass
 * through intact). The Supabase access token is attached by `proxyApi`.
 * Returns the upstream status and body unchanged.
 */
export async function forward(
  request: Request,
  path: string,
  options: ForwardOptions = {}
): Promise<NextResponse> {
  const url = new URL(request.url);
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (request.method !== "GET" && request.method !== "HEAD") {
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > 0) {
      body = bytes;
      headers["Content-Type"] = request.headers.get("content-type") ?? "application/json";
    } else if (options.emptyBody !== undefined) {
      body = options.emptyBody;
      headers["Content-Type"] = "application/json";
    }
  }

  const upstream = await proxyApi(path + url.search, {
    ...options.init,
    method: request.method,
    headers,
    body,
  });

  return RaftResponse.text(
    await upstream.text(),
    upstream.headers.get("content-type") ?? "application/json",
    upstream.status
  );
}
