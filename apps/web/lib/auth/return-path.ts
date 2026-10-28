/** Request header `proxy.ts` sets to the requested path (+ query string). */
export const PATHNAME_HEADER = "x-pathname";

/**
 * A safe post-login return path: only same-site paths like `/scan/abc`.
 * Rejects protocol-relative (`//host`) and backslash tricks so the value
 * can't turn the login redirect into an open redirect. Falls back to `/`.
 */
export function safeReturnPath(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return "/";
  }
  return path;
}
