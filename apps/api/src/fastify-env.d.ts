import "fastify";
import type { AuthenticatedUser } from "@dsc-hunt/types";
import type { EventHub } from "./modules/realtime/event-hub";

declare module "fastify" {
  interface FastifyInstance {
    eventHub: EventHub;
    config: {
      NODE_ENV: string;
      PORT: string;
      HOST: string;
      CORS_ORIGIN: string;
      SUPABASE_URL: string;
      SUPABASE_PUBLISHABLE_KEY: string;
      DATABASE_URL: string;
    };
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}
