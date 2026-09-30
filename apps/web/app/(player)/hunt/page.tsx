import Link from "next/link";
import { proxyApiJson } from "@/lib/api/proxy";
import { getAuthenticatedUser } from "@/lib/auth/session";
import type { AuthenticatedUser } from "@dsc-hunt/types";

/**
 * Placeholder player home. Shows the session as seen by the web app and by
 * the Fastify API (token forwarded via `proxyApiJson`) so the auth path can
 * be checked end-to-end until the real hunt UI lands.
 */
export default async function HuntPage() {
  const [user, api] = await Promise.all([
    getAuthenticatedUser(),
    proxyApiJson<{ user: AuthenticatedUser }>("/me"),
  ]);

  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome{user?.firstName ? `, ${user.firstName}` : ""}
      </h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Email</dt>
        <dd>{user?.email ?? "-"}</dd>
        <dt className="text-muted-foreground">WatIAM</dt>
        <dd>{user?.watIam ?? "-"}</dd>
        <dt className="text-muted-foreground">Role</dt>
        <dd>{user?.role}</dd>
        <dt className="text-muted-foreground">API</dt>
        <dd>
          {api.data
            ? `Authenticated as ${api.data.user.email ?? api.data.user.id}`
            : `${api.status || "Unreachable"} ${api.error ?? ""}`}
        </dd>
      </dl>
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to home
      </Link>
    </main>
  );
}
