import "fastify"

declare module "fastify" {
  interface FastifyInstance {
    config: {
      NODE_ENV: string
      PORT: string
      HOST: string
      CORS_ORIGIN: string
    }
  }
}
