import type { FastifySchema } from "fastify";

const teamObject = {
  type: "object",
  properties: {
    id: { type: "string" },
    eventId: { type: "string" },
    code: { type: "string" },
    name: { type: ["string", "null"] },
    createdAt: { type: "string" },
  },
} as const;

const teamDetailObject = {
  type: "object",
  properties: {
    team: teamObject,
    members: {
      type: "array",
      items: {
        type: "object",
        properties: {
          userId: { type: "string" },
          joinedAt: { type: "string" },
        },
      },
    },
  },
} as const;

export const teamsSchema = {
  create: {
    tags: ["teams"],
    summary: "Create a team in the given event and join as the creator",
    params: { type: "object", properties: { id: { type: "string" } } },
    body: {
      type: "object",
      properties: { name: { type: ["string", "null"] } },
    },
    response: { 201: teamObject },
  },
  join: {
    tags: ["teams"],
    summary: "Join a team by its 5-digit code",
    params: {
      type: "object",
      properties: {
        eventId: { type: "string" },
        code: { type: "string" },
      },
    },
    response: { 200: teamObject },
  },
  leave: {
    tags: ["teams"],
    summary: "Leave the current team",
    params: { type: "object", properties: { id: { type: "string" } } },
    response: {
      200: { type: "object", properties: { ok: { type: "boolean" } } },
    },
  },
  getDetail: {
    tags: ["teams"],
    summary: "Get team detail (team + member list)",
    params: { type: "object", properties: { id: { type: "string" } } },
    response: { 200: teamDetailObject },
  },
  listForEventAdmin: {
    tags: ["teams", "admin"],
    summary: "All teams for an event with scores (admin)",
    params: { type: "object", properties: { id: { type: "string" } } },
    response: {
      200: {
        type: "object",
        properties: {
          teams: {
            type: "array",
            items: {
              type: "object",
              properties: {
                team: teamObject,
                members: teamDetailObject.properties.members,
                score: {
                  type: "object",
                  properties: {
                    teamId: { type: "string" },
                    score: { type: "number" },
                    goodIntervals: { type: "number" },
                    submissionCount: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Record<string, FastifySchema>;
