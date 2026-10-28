import "server-only";

import { clientConfig } from "@/config/client";
import { getAccessToken } from "@/lib/auth/session";

/**
 * How long to wait for the API before giving up. Keeps a stuck upstream from
 * holding the request (and the player's screen) open until Vercel kills it.
 */
export const API_TIMEOUT_MS = 10_000;

interface ProxyOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
}

/** True for the error `fetch` throws when its `AbortSignal.timeout` fires. */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TimeoutError";
}

/**
 * Forwards a request to the Fastify API with the current Supabase access
 * token attached as a Bearer header. Returns the raw upstream Response
 * so the caller can stream it, copy headers, etc. Times out after
 * `API_TIMEOUT_MS` unless the caller passes its own `signal`.
 */
export async function proxyApi(path: string, options: ProxyOptions = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${clientConfig.apiUrl}${path}`, {
    ...options,
    headers,
    signal: options.signal ?? AbortSignal.timeout(API_TIMEOUT_MS),
  });
}

/**
 * Same as proxyApi but reads the JSON body. Use for non-streaming endpoints.
 */
export async function proxyApiJson<T>(
  path: string,
  options: ProxyOptions = {}
): Promise<{ status: number; data: T | null; error: string | null }> {
  const upstream = await proxyApi(path, options);
  const text = await upstream.text();
  let data: T | null = null;
  let error: string | null = null;
  if (text) {
    try {
      const parsed = JSON.parse(text);
      if (upstream.ok) data = parsed as T;
      else error = (parsed as { error?: string }).error ?? upstream.statusText;
    } catch {
      error = text;
    }
  } else if (!upstream.ok) {
    error = upstream.statusText;
  }
  return { status: upstream.status, data, error };
}
