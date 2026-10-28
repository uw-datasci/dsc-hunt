import "server-only";

import { RaftClient, RaftResponse } from "@uw-datasci/raft";
import type { NextResponse } from "next/server";
import { API_TIMEOUT_MS, isTimeoutError, proxyApi } from "./proxy";

interface ForwardOptions {
  /** Body to send when the incoming request has none (Fastify rejects an empty JSON body). */
  emptyBody?: string;
  /** Extra fetch options for the upstream call, e.g. `cache: "no-store"`. */
  init?: Omit<RequestInit, "method" | "body" | "headers" | "signal">;
  /** Upstream timeout. Defaults to `API_TIMEOUT_MS`; raise it for slow calls like uploads. */
  timeoutMs?: number;
}

/**
 * Forwards an incoming request to the Fastify API at `path`, keeping the
 * method, query string and body (read as bytes, so multipart uploads pass
 * through intact). The Supabase access token is attached by `proxyApi`.
 * Returns the upstream status and body unchanged, or a 504 when the API
 * doesn't answer in time.
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

  let upstream: Response;
  try {
    upstream = await proxyApi(path + url.search, {
      ...options.init,
      method: request.method,
      headers,
      body,
      signal: AbortSignal.timeout(options.timeoutMs ?? API_TIMEOUT_MS),
    });
  } catch (e) {
    // Other fetch failures are real faults: let withRaft quarantine them as a 500.
    if (!isTimeoutError(e)) throw e;
    await RaftClient.getInstance().reportError(
      new Error("API request timed out"),
      { route: url.pathname, method: request.method },
      "warning"
    );
    return RaftResponse.json(
      {
        error: "The hunt server took too long to respond",
        message: "API request timed out",
      },
      504
    );
  }

  return RaftResponse.text(
    await upstream.text(),
    upstream.headers.get("content-type") ?? "application/json",
    upstream.status
  );
}
