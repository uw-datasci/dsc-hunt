import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getProfile } from "@/lib/auth/profile";
import type { MeResponse } from "@dsc-hunt/types";

/**
 * Returns the signed-in user (Supabase auth) and their profile (main site's
 * `profiles` table). 401 when no valid session cookie is present.
 */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const profile = await getProfile(user.id);
  const response: MeResponse = { user, profile };
  return NextResponse.json(response);
}
