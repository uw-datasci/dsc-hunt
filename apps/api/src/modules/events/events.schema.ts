import type { FastifySchema } from "fastify";

const eventStatusEnum = ["draft", "active", "ended", "archived"];

const eventProps = {
  id: { type: "string" },
  name: { type: "string" },
  startsAt: { type: ["string", "null"] },
  durationMinutes: { type: "integer" },
  endsAt: { type: ["string", "null"] },
  pausedAt: { type: ["string", "null"] },
  teamSizeCap: { type: "integer" },
  questionCount: { type: "integer" },
  submissionCap: { type: "integer" },
  status: { type: "string", enum: eventStatusEnum },
  createdAt: { type: "string" },
} as const;

const eventObject = { type: "object", properties: eventProps } as const;

const eventStatsObject = {
  type: "object",
  properties: {
    teamCount: { type: "integer" },
    playerCount: { type: "integer" },
    questionCount: { type: "integer" },
    avgAnswered: { type: "number" },
    finishedCount: { type: "integer" },
  },
} as const;

const createBody = {
  type: "object",
  required: ["name", "durationMinutes"],
  properties: {
    name: { type: "string" },
    durationMinutes: { type: "integer", minimum: 1 },
    teamSizeCap: { type: "integer", minimum: 1 },
    questionCount: { type: "integer", minimum: 1 },
    submissionCap: { type: "integer", minimum: 1 },
  },
} as const;

const updateBody = {
  type: "object",
  properties: {
    name: { type: "string" },
    durationMinutes: { type: "integer", minimum: 1 },
    teamSizeCap: { type: "integer", minimum: 1 },
    questionCount: { type: "integer", minimum: 1 },
    submissionCap: { type: "integer", minimum: 1 },
    status: { type: "string", enum: eventStatusEnum },
  },
} as const;

const startBody = {
  type: "object",
  required: ["startsAt"],
  properties: {
    startsAt: { type: "string" },
  },
} as const;

export const eventsSchema = {
  getActive: {
    tags: ["events"],
    summary: "Latest active event, or one ended within the last 24 hours",
    response: {
      200: {
        type: "object",
        properties: { event: { ...eventObject, nullable: true } },
      },
    },
  },
  getById: {
    tags: ["events"],
    summary: "Get event by id",
    params: { type: "object", properties: { id: { type: "string" } } },
    response: { 200: eventObject },
  },
  list: {
    tags: ["events"],
    summary: "List all events",
    response: {
      200: {
        type: "object",
        properties: { events: { type: "array", items: eventObject } },
      },
    },
  },
  create: {
    tags: ["events", "admin"],
    summary: "Create an event",
    body: createBody,
    response: { 201: eventObject },
  },
  update: {
    tags: ["events", "admin"],
    summary: "Update an event",
    params: { type: "object", properties: { id: { type: "string" } } },
    body: updateBody,
    response: { 200: eventObject },
  },
  start: {
    tags: ["events", "admin"],
    summary: "Start a draft event at a scheduled (future) time",
    params: { type: "object", properties: { id: { type: "string" } } },
    body: startBody,
    response: { 200: eventObject },
  },
  pause: {
    tags: ["events", "admin"],
    summary: "Pause the live timer of an active event",
    params: { type: "object", properties: { id: { type: "string" } } },
    response: { 200: eventObject },
  },
  resume: {
    tags: ["events", "admin"],
    summary: "Resume a paused event's timer",
    params: { type: "object", properties: { id: { type: "string" } } },
    response: { 200: eventObject },
  },
  stats: {
    tags: ["events", "admin"],
    summary: "Live join/progress counters for the admin overview",
    params: { type: "object", properties: { id: { type: "string" } } },
    response: { 200: eventStatsObject },
  },
} satisfies Record<string, FastifySchema>;
