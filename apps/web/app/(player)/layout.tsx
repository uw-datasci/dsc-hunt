import { requireSession } from "@/lib/auth/session";

/**
 * Wraps every authenticated player page. Redirects to the main club site's
 * login screen when no session is present.
 */
export default async function PlayerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireSession();
  return <>{children}</>;
}
