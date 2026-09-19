import type { FastifySchema } from "fastify"

export const systemSchema = {
  health: {
    tags: ["system"],
    summary: "Health check",
    response: {
      200: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["ok"] },
        },
        required: ["status"],
      },
    },
  },

  welcome: {
    tags: ["system"],
    summary: "API root",
    response: {
      200: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
        required: ["message"],
      },
    },
  },
} satisfies Record<string, FastifySchema>
