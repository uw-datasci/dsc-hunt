import type { FastifySchema } from "fastify";

const nullableString = { type: ["string", "null"] } as const;

const adminRiddle = {
  type: "object",
  properties: {
    position: { type: "integer" },
    text: nullableString,
    answers: { type: "array", items: { type: "string" } },
    locationName: nullableString,
    qrIdentifier: nullableString,
  },
  required: ["position", "text", "answers", "locationName", "qrIdentifier"],
} as const;

const errorObject = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"],
} as const;

const eventParams = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
} as const;

const riddleParams = {
  type: "object",
  required: ["id", "position"],
  properties: {
    id: { type: "string", format: "uuid" },
    position: { type: "integer", minimum: 1, maximum: 6 },
  },
} as const;

export const adminRiddlesSchema = {
  list: {
    tags: ["riddles", "admin"],
    summary: "All 6 riddle positions for an event, with answers and QR codes. Staff only.",
    params: eventParams,
    response: {
      200: {
        type: "object",
        properties: { riddles: { type: "array", items: adminRiddle } },
        required: ["riddles"],
      },
      404: errorObject,
    },
  },
  save: {
    tags: ["riddles", "admin"],
    summary:
      "Create or update the riddle + location at a position. Staff only, before the start. " +
      "A QR code is generated the first time.",
    params: riddleParams,
    body: {
      type: "object",
      required: ["text", "answers", "locationName"],
      additionalProperties: false,
      properties: {
        text: { type: "string", minLength: 1, maxLength: 2000 },
        answers: {
          type: "array",
          minItems: 1,
          maxItems: 10,
          items: { type: "string", minLength: 1, maxLength: 200 },
        },
        locationName: { type: "string", minLength: 1, maxLength: 200 },
      },
    },
    response: {
      200: { type: "object", properties: { riddle: adminRiddle }, required: ["riddle"] },
      400: errorObject,
      404: errorObject,
      409: errorObject,
    },
  },
  regenerateQr: {
    tags: ["riddles", "admin"],
    summary: "Issue a new QR code for a position (old printed codes stop working). Staff only.",
    params: riddleParams,
    response: {
      200: {
        type: "object",
        properties: { qrIdentifier: { type: "string" } },
        required: ["qrIdentifier"],
      },
      404: errorObject,
      409: errorObject,
    },
  },
} satisfies Record<string, FastifySchema>;
