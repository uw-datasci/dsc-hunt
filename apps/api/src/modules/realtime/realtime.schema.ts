import type { FastifySchema } from "fastify";

export const realtimeSchema = {
  stream: {
    tags: ["realtime"],
    summary: "SSE stream for live event updates",
    params: { type: "object", properties: { id: { type: "string" } } },
  },
  setEditing: {
    tags: ["realtime"],
    summary: "Announce or clear that the caller is editing a question",
    params: { type: "object", properties: { id: { type: "string" } } },
    body: {
      type: "object",
      required: ["teamId", "questionId", "editing", "name"],
      properties: {
        teamId: { type: "string" },
        questionId: { type: "string" },
        editing: { type: "boolean" },
        name: { type: "string" },
        avatarUrl: { type: ["string", "null"] },
      },
    },
  },
} satisfies Record<string, FastifySchema>;
