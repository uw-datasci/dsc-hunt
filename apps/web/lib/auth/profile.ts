import "server-only"

import { cache } from "react"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Profile } from "@dsc-hunt/types"

interface ProfileRow {
  id: string
  first_name: string | null
  last_name: string | null
  wat_iam: string | null
  faculty: string | null
  term: string | null
}

/**
 * Reads a user profile from the main club site's `profiles` table. Returns
 * null if the profile doesn't exist (e.g. user hasn't completed onboarding
 * on the main site yet).
 *
 * Wrapped in React's `cache()` so multiple callers within the same request
 * (e.g. `getAuthenticatedUser()` and `/api/me`) share one Supabase round trip.
 */
export const getProfile = cache(
  async (userId: string): Promise<Profile | null> => {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, wat_iam, faculty, term")
      .eq("id", userId)
      .maybeSingle<ProfileRow>()

    if (error || !data) return null
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      watIam: data.wat_iam,
      faculty: data.faculty,
      term: data.term,
    }
  }
)
