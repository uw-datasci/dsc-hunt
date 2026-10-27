import type { FastifySchema } from "fastify";

const teamProperties = {
  id: { type: "string" },
  eventId: { type: "string" },
  code: { type: "string" },
  name: { type: "string" },
  createdAt: { type: "string" },
} as const;

const teamRequired = ["id", "eventId", "code", "name", "createdAt"] as const;

const teamObject = {
  type: "object",
  properties: teamProperties,
  required: [...teamRequired],
} as const;

const memberObject = {
  type: "object",
  properties: {
    userId: { type: "string" },
    displayName: { type: "string" },
    joinedAt: { type: "string" },
  },
  required: ["userId", "displayName", "joinedAt"],
} as const;

const membersArray = { type: "array", items: memberObject } as const;

const teamWithMembersObject = {
  type: "object",
  properties: { ...teamProperties, members: membersArray },
  required: [...teamRequired, "members"],
} as const;

const teamEnvelope = {
  type: "object",
  properties: { team: teamObject },
  required: ["team"],
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

const joinParams = {
  type: "object",
  required: ["id", "code"],
  properties: {
    id: { type: "string", format: "uuid" },
    code: { type: "string", pattern: "^[0-9]{5}$" },
  },
} as const;

const teamParams = eventParams;

const createBody = {
  type: "object",
  additionalProperties: false,
  properties: { name: { type: "string", maxLength: 100 } },
} as const;

export const teamsSchema = {
  create: {
    tags: ["teams"],
    summary: "Create a team and join it. Name defaults to `Team <code>`.",
    params: eventParams,
    body: createBody,
    response: { 201: teamEnvelope, 400: errorObject, 404: errorObject, 409: errorObject },
  },
  join: {
    tags: ["teams"],
    summary: "Join a team by its 5-digit code",
    params: joinParams,
    response: { 200: teamEnvelope, 400: errorObject, 404: errorObject, 409: errorObject },
  },
  getMine: {
    tags: ["teams"],
    summary: "The caller's team for this event, or null",
    params: eventParams,
    response: {
      200: {
        type: "object",
        properties: { team: { anyOf: [teamWithMembersObject, { type: "null" }] } },
        required: ["team"],
      },
      404: errorObject,
    },
  },
  getDetail: {
    tags: ["teams"],
    summary: "A team and its members. Members and staff only.",
    params: teamParams,
    response: {
      200: {
        type: "object",
        properties: { team: teamObject, members: membersArray },
        required: ["team", "members"],
      },
      403: errorObject,
      404: errorObject,
    },
  },
  leave: {
    tags: ["teams"],
    summary: "Leave a team. Only before the hunt starts; empty teams are deleted.",
    params: teamParams,
    response: { 400: errorObject, 404: errorObject },
  },
} satisfies Record<string, FastifySchema>;
