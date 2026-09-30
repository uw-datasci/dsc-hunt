/**
 * Fetches `first_name` / `last_name` / `wat_iam` for the authenticated user
 * from the main club site's `public.profiles` table (same Supabase project,
 * different app - the API has no local profile store; see `auth.ts`).
 *
 * The gateway requires an `apikey` even though RLS is what actually scopes
 * the read (`id = auth.uid() OR is_exec_or_admin(...)`), so we forward the
 * caller's own token alongside the shared publishable key.
 *
 * Results (including "no profile row yet") are cached in-memory per user so
 * this doesn't add a PostgREST round trip to every request. One instance per
 * Fastify process (same scaling caveat as EventHub/EditingPresenceStore).
 */
const TTL_MS = 5 * 60 * 1000
const NEGATIVE_TTL_MS = 30 * 1000
const SWEEP_INTERVAL_MS = 60 * 1000

export interface ProfileFields {
  firstName: string | null
  lastName: string | null
  watIam: string | null
}

const EMPTY_PROFILE: ProfileFields = {
  firstName: null,
  lastName: null,
  watIam: null,
}

interface ProfileRow {
  first_name: string | null
  last_name: string | null
  wat_iam: string | null
}

interface Entry {
  value: ProfileFields
  expiresAt: number
}

export class ProfileCache {
  private readonly entries = new Map<string, Entry>()
  private readonly sweepTimer: ReturnType<typeof setInterval>

  constructor(
    private readonly supabaseUrl: string,
    private readonly publishableKey: string,
    private readonly log: { warn: (obj: unknown, msg?: string) => void }
  ) {
    this.sweepTimer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS)
    this.sweepTimer.unref?.()
  }

  async get(userId: string, token: string): Promise<ProfileFields> {
    const cached = this.entries.get(userId)
    if (cached && cached.expiresAt > Date.now()) return cached.value

    const value = await this.fetchProfile(userId, token)
    return value
  }

  private async fetchProfile(
    userId: string,
    token: string
  ): Promise<ProfileFields> {
    if (!this.supabaseUrl || !this.publishableKey) {
      this.log.warn(
        "profileCache: SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY not configured, returning empty profile"
      )
      return EMPTY_PROFILE
    }

    try {
      const url = new URL("/rest/v1/profiles", this.supabaseUrl)
      url.searchParams.set("select", "first_name,last_name,wat_iam")
      url.searchParams.set("id", `eq.${userId}`)

      const res = await fetch(url, {
        headers: {
          apikey: this.publishableKey,
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.pgrst.object+json",
        },
      })

      // 406 = PGRST116 (no row matched .single()); a real "no profile yet".
      if (res.status === 406) {
        this.entries.set(userId, {
          value: EMPTY_PROFILE,
          expiresAt: Date.now() + TTL_MS,
        })
        return EMPTY_PROFILE
      }

      if (!res.ok) {
        this.log.warn(
          { status: res.status, userId },
          "profileCache: profiles fetch failed, returning empty profile"
        )
        this.entries.set(userId, {
          value: EMPTY_PROFILE,
          expiresAt: Date.now() + NEGATIVE_TTL_MS,
        })
        return EMPTY_PROFILE
      }

      const row = (await res.json()) as ProfileRow
      const value: ProfileFields = {
        firstName: row.first_name,
        lastName: row.last_name,
        watIam: row.wat_iam,
      }
      this.entries.set(userId, { value, expiresAt: Date.now() + TTL_MS })
      return value
    } catch (err) {
      this.log.warn(
        { err: (err as Error).message, userId },
        "profileCache: profiles fetch threw, returning empty profile"
      )
      this.entries.set(userId, {
        value: EMPTY_PROFILE,
        expiresAt: Date.now() + NEGATIVE_TTL_MS,
      })
      return EMPTY_PROFILE
    }
  }

  private sweep() {
    const now = Date.now()
    for (const [userId, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(userId)
    }
  }

  dispose() {
    clearInterval(this.sweepTimer)
  }
}
