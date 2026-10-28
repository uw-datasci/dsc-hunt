import type { FastifySchema } from "fastify";

const statusEnum = { type: "string", enum: ["unvisited", "solved", "visited"] } as const;

const teamProgress = {
  type: "object",
  properties: {
    teamId: { type: "string" },
    name: { type: "string" },
    totalScore: { type: "integer" },
    lastScoredAt: { type: ["string", "null"] },
    activeRiddle: { type: ["integer", "null"] },
    riddles: { type: "array", items: statusEnum },
    found: { type: "integer" },
    lastScan: {
      anyOf: [
        {
          type: "object",
          properties: { locationName: { type: "string" }, scannedAt: { type: "string" } },
          required: ["locationName", "scannedAt"],
        },
        { type: "null" },
      ],
    },
  },
  required: [
    "teamId",
    "name",
    "totalScore",
    "lastScoredAt",
    "activeRiddle",
    "riddles",
    "found",
    "lastScan",
  ],
} as const;

const scan = {
  type: "object",
  properties: {
    teamId: { type: "string" },
    teamName: { type: "string" },
    position: { type: "integer" },
    locationName: { type: "string" },
    points: { type: "integer" },
    scannedAt: { type: "string" },
  },
  required: ["teamId", "teamName", "position", "locationName", "points", "scannedAt"],
} as const;

export const adminProgressSchema = {
  get: {
    tags: ["admin"],
    summary:
      "Live progress: every team's riddle statuses and latest scan (leaderboard order), plus " +
      "the 20 most recent scans. Staff only.",
    params: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", format: "uuid" } },
    },
    response: {
      200: {
        type: "object",
        properties: {
          teams: { type: "array", items: teamProgress },
          recentScans: { type: "array", items: scan },
        },
        required: ["teams", "recentScans"],
      },
      404: {
        type: "object",
        properties: { error: { type: "string" } },
        required: ["error"],
      },
    },
  },
} satisfies Record<string, FastifySchema>;
