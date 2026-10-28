import { withRaft, RaftResponse } from "@uw-datasci/raft";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getProfile } from "@/lib/auth/profile";
import type { MeResponse } from "@dsc-hunt/types";

/**
 * Returns the signed-in user (Supabase auth) and their profile (main site's
 * `profiles` table). 401 when no valid session cookie is present.
 */
export const GET = withRaft(async () => {
  const user = await getAuthenticatedUser();
  if (!user) {
    return RaftResponse.unauthorized(undefined, "Unauthenticated");
  }

  const profile = await getProfile(user.id);
  const response: MeResponse = { user, profile };
  return RaftResponse.ok(response);
});
