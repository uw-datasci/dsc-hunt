import type { FastifySchema } from "fastify";

export const realtimeSchema = {
  stream: {
    tags: ["realtime"],
    summary: "SSE stream of live event updates",
    description:
      "Server-sent events. Sends an `event_status` snapshot on connect. Everyone then gets " +
      "`event_status` and `score_update`; `team_progress` and `team_members` go only to that " +
      "team's members and staff; `event_stats` goes only to staff. EventSource cannot set " +
      "headers, so pass the JWT as `?access_token=`.",
    params: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    produces: ["text/event-stream"],
  },
} satisfies Record<string, FastifySchema>;
