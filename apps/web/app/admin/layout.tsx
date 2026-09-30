import { requireAdmin } from "@/lib/auth/session";

/**
 * Wraps every admin page. 401 -> main site login. Non-staff -> /unauthorized.
 */
export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();
  return <>{children}</>;
}
