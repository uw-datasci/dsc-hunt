import type { FastifySchema } from "fastify"

const nullableString = { type: ["string", "null"] }

export const meSchema = {
  get: {
    tags: ["me"],
    summary: "Current authenticated user",
    response: {
      200: {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: nullableString,
              role: {
                type: "string",
                enum: ["pres", "admin", "exec", "member"],
              },
              firstName: nullableString,
              lastName: nullableString,
              watIam: nullableString,
            },
            required: [
              "id",
              "email",
              "role",
              "firstName",
              "lastName",
              "watIam",
            ],
          },
        },
        required: ["user"],
      },
    },
  },
} satisfies Record<string, FastifySchema>
