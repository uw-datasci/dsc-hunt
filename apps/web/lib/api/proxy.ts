import "server-only"

import { clientConfig } from "@/config/client"
import { getAccessToken } from "@/lib/auth/session"

interface ProxyOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>
}

/**
 * Forwards a request to the Fastify API with the current Supabase access
 * token attached as a Bearer header. Returns the raw upstream Response
 * so the caller can stream it, copy headers, etc.
 */
export async function proxyApi(
  path: string,
  options: ProxyOptions = {}
): Promise<Response> {
  const token = await getAccessToken()
  const headers: Record<string, string> = { ...options.headers }
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(`${clientConfig.apiUrl}${path}`, { ...options, headers })
}

/**
 * Same as proxyApi but reads the JSON body. Use for non-streaming endpoints.
 */
export async function proxyApiJson<T>(
  path: string,
  options: ProxyOptions = {}
): Promise<{ status: number; data: T | null; error: string | null }> {
  const upstream = await proxyApi(path, options)
  const text = await upstream.text()
  let data: T | null = null
  let error: string | null = null
  if (text) {
    try {
      const parsed = JSON.parse(text)
      if (upstream.ok) data = parsed as T
      else error = (parsed as { error?: string }).error ?? upstream.statusText
    } catch {
      error = text
    }
  } else if (!upstream.ok) {
    error = upstream.statusText
  }
  return { status: upstream.status, data, error }
}
