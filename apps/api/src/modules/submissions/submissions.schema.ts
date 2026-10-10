import type { FastifySchema } from "fastify";

const submissionObject = {
  type: "object",
  properties: {
    id: { type: "number" },
    teamId: { type: "string" },
    questionId: { type: "string" },
    userId: { type: "string" },
    minValue: { type: "number" },
    maxValue: { type: "number" },
    submittedAt: { type: "string" },
  },
} as const;

const teamScoreObject = {
  type: "object",
  properties: {
    teamId: { type: "string" },
    score: { type: "number" },
    goodIntervals: { type: "integer" },
    submissionCount: { type: "integer" },
    evaluations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          questionId: { type: "string" },
          correct: { type: "boolean" },
        },
      },
    },
  },
} as const;

export const submissionsSchema = {
  submit: {
    tags: ["submissions"],
    summary: "Submit a range guess for a question",
    body: {
      type: "object",
      required: ["teamId", "questionId", "minValue", "maxValue"],
      properties: {
        teamId: { type: "string" },
        questionId: { type: "string" },
        minValue: { type: "number" },
        maxValue: { type: "number" },
      },
    },
    response: {
      201: {
        type: "object",
        properties: {
          submission: submissionObject,
          teamScore: teamScoreObject,
        },
      },
    },
  },
  listForTeam: {
    tags: ["submissions"],
    summary: "List submissions for a team",
    params: { type: "object", properties: { id: { type: "string" } } },
    response: {
      200: {
        type: "object",
        properties: {
          submissions: { type: "array", items: submissionObject },
        },
      },
    },
  },
  score: {
    tags: ["submissions"],
    summary: "Get current score for a team",
    params: { type: "object", properties: { id: { type: "string" } } },
    response: { 200: teamScoreObject },
  },
} satisfies Record<string, FastifySchema>;
