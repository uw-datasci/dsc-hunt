/**
 * OpenAPI documentation and interactive UI (non-production only).
 *
 * Registers `@fastify/swagger` to emit an OpenAPI spec from route schemas, and
 * `@fastify/swagger-ui` to serve the Swagger UI at `/docs`. This plugin is
 * only registered when `NODE_ENV !== "production"` so API docs are not exposed
 * in production by default.
 */
import type { FastifyInstance } from "fastify"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"

export async function registerSwagger(fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Sample API",
        version: "1.0.0",
      },
    },
  })

  await fastify.register(swaggerUi, { routePrefix: "/docs" })
}
