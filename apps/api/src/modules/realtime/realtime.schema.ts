import type { FastifySchema } from "fastify";

export const realtimeSchema = {
  stream: {
    tags: ["realtime"],
    summary: "SSE stream of live event updates (`event_status` messages)",
    description:
      "Server-sent events. Sends an `event_status` snapshot on connect, then one message per " +
      "status change. EventSource cannot set headers, so pass the JWT as `?access_token=`.",
    params: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    produces: ["text/event-stream"],
  },
} satisfies Record<string, FastifySchema>;
