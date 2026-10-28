import type { FastifySchema } from "fastify";
import { EVENT_STATUSES } from "@dsc-hunt/types";

const nullableString = { type: ["string", "null"] };

const eventObject = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    status: { type: "string", enum: [...EVENT_STATUSES] },
    startedAt: nullableString,
    endedAt: nullableString,
    teamSizeCap: { type: "integer" },
    startingLocationName: nullableString,
    startingLocationDetails: nullableString,
    createdAt: { type: "string" },
  },
  required: [
    "id",
    "name",
    "status",
    "startedAt",
    "endedAt",
    "teamSizeCap",
    "startingLocationName",
    "startingLocationDetails",
    "createdAt",
  ],
} as const;

const eventEnvelope = {
  type: "object",
  properties: { event: eventObject },
  required: ["event"],
} as const;

const errorObject = {
  type: "object",
  properties: { error: { type: "string" } },
  required: ["error"],
} as const;

const idParams = {
  type: "object",
  properties: { id: { type: "string", format: "uuid" } },
  required: ["id"],
} as const;

const statsObject = {
  type: "object",
  properties: {
    teamCount: { type: "integer" },
    playerCount: { type: "integer" },
    configuredRiddles: { type: "integer" },
    totalRiddles: { type: "integer" },
    scanCount: { type: "integer" },
    startingLocationSet: { type: "boolean" },
    startBlockers: { type: "array", items: { type: "string" } },
  },
  required: [
    "teamCount",
    "playerCount",
    "configuredRiddles",
    "totalRiddles",
    "scanCount",
    "startingLocationSet",
    "startBlockers",
  ],
} as const;

export const eventsSchema = {
  create: {
    tags: ["events", "admin"],
    summary:
      "Create a new hunt. Staff only. Allowed when every existing event has ended (or there are none).",
    body: {
      type: "object",
      required: ["name"],
      additionalProperties: false,
      properties: {
        name: { type: "string", minLength: 1, maxLength: 100 },
        teamSizeCap: { type: "integer", minimum: 1, maximum: 20 },
      },
    },
    response: {
      201: eventEnvelope,
      400: errorObject,
      409: errorObject,
    },
  },
  getStats: {
    tags: ["events", "admin"],
    summary: "Dashboard counters and start readiness (start blockers). Staff only.",
    params: idParams,
    response: {
      200: { type: "object", properties: { stats: statsObject }, required: ["stats"] },
      404: errorObject,
    },
  },
  getCurrent: {
    tags: ["events"],
    summary: "The current hunt (newest event)",
    response: { 200: eventEnvelope, 404: errorObject },
  },
  getById: {
    tags: ["events"],
    summary: "Get an event by id",
    params: idParams,
    response: { 200: eventEnvelope, 404: errorObject },
  },
  start: {
    tags: ["events", "admin"],
    summary:
      "Start the hunt (not_started -> live). Staff only. 409 until all riddles are set up, " +
      "the starting location is set, and at least one team has registered.",
    params: idParams,
    response: { 200: eventEnvelope, 404: errorObject, 409: errorObject },
  },
  setStartingLocation: {
    tags: ["events", "admin"],
    summary:
      "Set the starting location (event venue). Staff only, before the start. A blank name clears it.",
    params: idParams,
    body: {
      type: "object",
      required: ["name"],
      additionalProperties: false,
      properties: {
        name: { type: "string", maxLength: 100 },
        details: { type: ["string", "null"], maxLength: 500 },
      },
    },
    response: { 200: eventEnvelope, 404: errorObject, 409: errorObject },
  },
  end: {
    tags: ["events", "admin"],
    summary: "End the hunt (live -> ended). Staff only. Cannot be restarted.",
    params: idParams,
    response: { 200: eventEnvelope, 404: errorObject, 409: errorObject },
  },
} satisfies Record<string, FastifySchema>;
