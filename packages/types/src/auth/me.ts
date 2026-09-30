import type { AuthenticatedUser, Profile } from "./user"

export interface MeResponse {
  user: AuthenticatedUser
  profile: Profile | null
}
