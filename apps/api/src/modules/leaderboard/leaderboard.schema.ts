import type { FastifySchema } from "fastify";

const leaderboardEntry = {
  type: "object",
  properties: {
    teamId: { type: "string" },
    code: { type: "string" },
    name: { type: ["string", "null"] },
    score: { type: "number" },
    goodIntervals: { type: "number" },
    submissionCount: { type: "number" },
    members: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          firstName: { type: ["string", "null"] },
          lastName: { type: ["string", "null"] },
        },
      },
    },
  },
} as const;

export const leaderboardSchema = {
  getForEvent: {
    tags: ["leaderboard"],
    summary: "Leaderboard for an event (lower score is better)",
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          leaderboard: {
            type: "array",
            items: leaderboardEntry,
          },
        },
      },
    },
  },
} satisfies Record<string, FastifySchema>;
