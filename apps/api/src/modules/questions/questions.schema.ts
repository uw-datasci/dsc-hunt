import type { FastifySchema } from "fastify";

const questionObject = {
  type: "object",
  properties: {
    id: { type: "string" },
    eventId: { type: "string" },
    position: { type: "integer" },
    prompt: { type: "string" },
    answer: { type: "number" },
    createdAt: { type: "string" },
  },
} as const;

export const questionsSchema = {
  listForPlayers: {
    tags: ["questions"],
    summary: "Questions for an event (player view)",
    params: { type: "object", properties: { id: { type: "string" } } },
    response: {
      200: {
        type: "object",
        properties: {
          questions: { type: "array", items: questionObject },
        },
      },
    },
  },
  listAll: {
    tags: ["questions", "admin"],
    summary: "All questions for an event (admin)",
    params: { type: "object", properties: { id: { type: "string" } } },
    response: {
      200: {
        type: "object",
        properties: {
          questions: { type: "array", items: questionObject },
        },
      },
    },
  },
  create: {
    tags: ["questions", "admin"],
    summary: "Create a question",
    params: { type: "object", properties: { id: { type: "string" } } },
    body: {
      type: "object",
      required: ["prompt", "answer"],
      properties: {
        prompt: { type: "string" },
        answer: { type: "number" },
        position: { type: "integer" },
      },
    },
    response: { 201: questionObject },
  },
  update: {
    tags: ["questions", "admin"],
    summary: "Update a question",
    params: { type: "object", properties: { id: { type: "string" } } },
    body: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        answer: { type: "number" },
        position: { type: "integer" },
      },
    },
    response: { 200: questionObject },
  },
  delete: {
    tags: ["questions", "admin"],
    summary: "Delete a question",
    params: { type: "object", properties: { id: { type: "string" } } },
    response: {
      200: { type: "object", properties: { ok: { type: "boolean" } } },
    },
  },
} satisfies Record<string, FastifySchema>;
