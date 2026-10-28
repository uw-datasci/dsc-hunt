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

export const eventsSchema = {
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
    summary: "Start the hunt (not_started -> live). Staff only.",
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
