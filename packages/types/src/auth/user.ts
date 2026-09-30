export type UserRole = "pres" | "admin" | "exec" | "member";

const STAFF_ROLES = new Set<UserRole>(["pres", "admin", "exec"]);

/** Map Supabase `app_metadata.role` to a known role; unknown values become `member`. */
export function parseUserRole(raw: string | undefined): UserRole {
  if (raw && isStaffRole(raw as UserRole)) return raw as UserRole;
  return "member";
}

/** Roles that can access admin / staff-protected surfaces. */
export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.has(role);
}

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  watIam: string | null;
}

export interface Profile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  watIam: string | null;
  faculty: string | null;
  term: string | null;
}
