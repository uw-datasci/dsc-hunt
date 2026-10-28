import "fastify";
import type { AuthenticatedUser } from "@dsc-hunt/types";
import type { EventHub } from "./modules/realtime/event-hub";
import type { ObjectStorage } from "./plugins/storage";

declare module "fastify" {
  interface FastifyInstance {
    eventHub: EventHub;
    /** Riddle image storage; null until the AWS_* / S3_BUCKET env vars are set. */
    storage: ObjectStorage | null;
    config: {
      NODE_ENV: string;
      PORT: string;
      HOST: string;
      CORS_ORIGIN: string;
      SUPABASE_URL: string;
      SUPABASE_PUBLISHABLE_KEY: string;
      DATABASE_URL: string;
      AWS_ENDPOINT_URL_S3: string;
      AWS_REGION: string;
      AWS_ACCESS_KEY_ID: string;
      AWS_SECRET_ACCESS_KEY: string;
      S3_BUCKET: string;
    };
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}
