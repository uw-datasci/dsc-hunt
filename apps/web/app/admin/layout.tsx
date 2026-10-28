import { headers } from "next/headers";
import { PATHNAME_HEADER, safeReturnPath } from "@/lib/auth/return-path";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Wraps every admin page. 401 -> main site login, returning to the requested
 * admin page afterwards. Non-staff -> /unauthorized.
 */
export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const returnTo = safeReturnPath((await headers()).get(PATHNAME_HEADER));
  await requireAdmin(returnTo);
  return <>{children}</>;
}
