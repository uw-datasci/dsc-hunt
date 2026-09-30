import "fastify"
import type { AuthenticatedUser } from "@dsc-hunt/types"

declare module "fastify" {
  interface FastifyInstance {
    config: {
      NODE_ENV: string
      PORT: string
      HOST: string
      CORS_ORIGIN: string
      SUPABASE_URL: string
      SUPABASE_PUBLISHABLE_KEY: string
    }
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireAdmin: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>
  }

  interface FastifyRequest {
    user?: AuthenticatedUser
  }
}
