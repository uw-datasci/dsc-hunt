import { headers } from "next/headers";
import { PATHNAME_HEADER, safeReturnPath } from "@/lib/auth/return-path";
import { requireSession } from "@/lib/auth/session";

/**
 * Wraps every authenticated player page. Redirects to the main club site's
 * login screen when no session is present, returning to the requested page
 * (e.g. a scanned `/scan/<code>`) afterwards.
 */
export default async function PlayerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const returnTo = safeReturnPath((await headers()).get(PATHNAME_HEADER));
  await requireSession(returnTo);
  return <>{children}</>;
}
