/**
 * Verifies Supabase-issued JWTs sent as `Authorization: Bearer <token>`.
 *
 * The token is issued by the main club site (uwdsc-website-v3) using
 * Supabase Auth; this server only verifies and trusts it. We do not have a
 * Supabase client here, but we do read `public.profiles` directly over
 * PostgREST (same Supabase project as the main site) using the caller's own
 * token, since the API has no local profile store - see `profile-cache.ts`.
 *
 * Verification uses the project's JWKS (asymmetric signing keys). Public keys are
 * fetched from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`.
 *
 * Decorators:
 *   fastify.requireAuth   - preHandler that 401s on missing/invalid token
 *   fastify.requireAdmin  - preHandler that 401s without a token and 403s
 *                            unless `app_metadata.role` is staff (`pres`, `admin`, or `exec`)
 *
 * Request augmentation:
 *   request.user          - { id, email, role, firstName, lastName, watIam }
 *                            when a valid token is present
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { JWTPayload } from "jose";
import { isStaffRole, parseUserRole, type AuthenticatedUser } from "@dsc-hunt/types";
import { ProfileCache } from "./profile-cache";

interface SupabaseJWTPayload extends JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  app_metadata?: { role?: string; [k: string]: unknown };
  user_metadata?: Record<string, unknown>;
}

function supabaseAuthBaseUrl(supabaseUrl: string): string {
  return supabaseUrl.replace(/\/$/, "");
}

function supabaseJwksUrl(supabaseUrl: string): URL {
  return new URL(`${supabaseAuthBaseUrl(supabaseUrl)}/auth/v1/.well-known/jwks.json`);
}

function extractToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (header) {
    const [scheme, token] = header.split(" ", 2);
    if (scheme?.toLowerCase() === "bearer" && token) return token.trim();
  }

  // EventSource cannot set Authorization; clients may pass ?access_token=.
  const query = request.query as { access_token?: string };
  if (typeof query.access_token === "string" && query.access_token.trim()) {
    return query.access_token.trim();
  }

  return null;
}

async function payloadToUser(
  payload: SupabaseJWTPayload,
  token: string,
  profileCache: ProfileCache
): Promise<AuthenticatedUser> {
  const role = parseUserRole(payload.app_metadata?.role);
  const profile = await profileCache.get(payload.sub, token);
  return { id: payload.sub, email: payload.email ?? null, role, ...profile };
}

export async function registerAuth(fastify: FastifyInstance) {
  const supabaseUrl = fastify.config.SUPABASE_URL.trim();
  const jwks = supabaseUrl.length > 0 ? createRemoteJWKSet(supabaseJwksUrl(supabaseUrl)) : null;
  const issuer = supabaseUrl.length > 0 ? `${supabaseAuthBaseUrl(supabaseUrl)}/auth/v1` : null;
  const profileCache = new ProfileCache(
    supabaseUrl,
    fastify.config.SUPABASE_PUBLISHABLE_KEY.trim(),
    fastify.log
  );
  fastify.addHook("onClose", async () => profileCache.dispose());

  if (!jwks) fastify.log.warn("SUPABASE_URL is not set");

  async function verify(request: FastifyRequest): Promise<AuthenticatedUser | null> {
    if (!jwks || !issuer) {
      request.log.warn("auth: jwks/issuer not configured (SUPABASE_URL missing?)");
      return null;
    }
    const token = extractToken(request);
    if (!token) {
      request.log.warn(
        {
          url: request.url,
          method: request.method,
          hasAuthHeader: !!request.headers.authorization,
        },
        "auth: no token on request"
      );
      return null;
    }

    try {
      const { payload } = await jwtVerify(token, jwks, { issuer });
      if (typeof payload.sub !== "string") {
        request.log.warn({ payload }, "auth: token missing sub");
        return null;
      }
      return await payloadToUser(payload as SupabaseJWTPayload, token, profileCache);
    } catch (err) {
      request.log.warn(
        {
          err: (err as Error).message,
          issuer,
          tokenPrefix: token.slice(0, 24),
        },
        "auth: jwt verification failed"
      );
      return null;
    }
  }

  // Always-on hook: populate request.user when a valid token is present, but
  // do not reject - routes opt in via requireAuth / requireAdmin.
  fastify.addHook("onRequest", async (request) => {
    const user = await verify(request);
    if (user) request.user = user;
  });

  fastify.decorate(
    "requireAuth",
    async function (request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) await reply.code(401).send({ error: "Unauthenticated" });
    }
  );

  fastify.decorate(
    "requireAdmin",
    async function (request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) {
        await reply.code(401).send({ error: "Unauthenticated" });
        return;
      }

      if (!isStaffRole(request.user.role)) await reply.code(403).send({ error: "Forbidden" });
    }
  );
}
