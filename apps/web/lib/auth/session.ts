import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildLoginUrl } from "@/lib/auth/login-url";
import { getProfile } from "@/lib/auth/profile";
import { isStaffRole, parseUserRole, type AuthenticatedUser } from "@dsc-hunt/types";

/**
 * Returns the access token of the current session, or null if no valid
 * session is present. Use this in route handlers when proxying to the
 * Fastify API.
 */
export async function getAccessToken(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Returns the authenticated user, or null. Calls `auth.getUser()` (which
 * revalidates the token server-side) instead of relying on the local
 * session, so we don't trust a stale cookie.
 *
 * Also reads the user's profile row (`getProfile`, cached per-request) so
 * `firstName`/`lastName`/`watIam` are populated from the main site's
 * `profiles` table rather than left null.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const role = parseUserRole(data.user.app_metadata?.role as string | undefined);
  const profile = await getProfile(data.user.id);
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    role,
    firstName: profile?.firstName ?? null,
    lastName: profile?.lastName ?? null,
    watIam: profile?.watIam ?? null,
  };
}

export interface SessionIdentity {
  userId: string;
  name: string;
  avatarUrl: string | null;
}

/**
 * Returns display identity (name + avatar) for the current session. Name
 * prefers the main site's profile (first/last name); avatar still comes from
 * Supabase user metadata since profiles has no avatar field. Used to label
 * "teammate is editing" presence - null when unauthenticated.
 */
export async function getSessionIdentity(): Promise<SessionIdentity | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const profile = await getProfile(data.user.id);
  const metadata = data.user.user_metadata ?? {};
  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || undefined;
  const name =
    fullName ??
    (metadata.full_name as string | undefined) ??
    (metadata.name as string | undefined) ??
    "Teammate";
  return {
    userId: data.user.id,
    name,
    avatarUrl: (metadata.avatar_url as string | undefined) ?? null,
  };
}

/**
 * Server-side guard: redirects to the main club site's login page when no
 * session is present. Returns the authenticated user on success.
 */
export async function requireSession(returnTo?: string): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) redirect(await buildLoginUrl(returnTo));

  return user;
}

/**
 * Like requireSession but additionally requires a staff `app_metadata.role`
 * (`pres`, `admin`, or `exec`). Redirects to /unauthorized otherwise.
 */
export async function requireAdmin(returnTo?: string): Promise<AuthenticatedUser> {
  const user = await requireSession(returnTo);
  if (!isStaffRole(user.role)) redirect("/unauthorized");
  return user;
}
