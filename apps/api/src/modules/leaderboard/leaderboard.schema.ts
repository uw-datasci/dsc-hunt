import type { FastifySchema } from "fastify";

const leaderboardEntry = {
  type: "object",
  properties: {
    rank: { type: "integer" },
    teamId: { type: "string" },
    name: { type: "string" },
    totalScore: { type: "integer" },
    lastScoredAt: { type: ["string", "null"] },
  },
  required: ["rank", "teamId", "name", "totalScore", "lastScoredAt"],
} as const;

const errorObject = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"],
} as const;

export const leaderboardSchema = {
  getForEvent: {
    tags: ["leaderboard"],
    summary: "Leaderboard for an event (highest score first)",
    params: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    response: {
      200: {
        type: "object",
        properties: { leaderboard: { type: "array", items: leaderboardEntry } },
        required: ["leaderboard"],
      },
      404: errorObject,
    },
  },
} satisfies Record<string, FastifySchema>;
