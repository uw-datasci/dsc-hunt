import type { FastifyReply } from "fastify";
import type { ServerMessage } from "@dsc-hunt/types";

const HEARTBEAT_MS = 25_000;

/** Who is on the other end of a stream; decides which messages they receive. */
export interface Subscriber {
  /** Null for an anonymous viewer (e.g. the public leaderboard). */
  userId: string | null;
  /** The user's team in this event, kept current by `setUserTeam`. */
  teamId: string | null;
  isStaff: boolean;
}

/**
 * In-memory pub/sub for SSE clients keyed by event id.
 * One hub per Fastify instance.
 *
 * Audiences:
 * - `publish`: everyone on the event (status changes, scores).
 * - `publishToTeam`: one team's members, plus staff (riddle progress, roster).
 * - `publishToStaff`: staff only (admin counters).
 */
export class EventHub {
  private readonly subscribers = new Map<string, Map<FastifyReply, Subscriber>>();
  private readonly heartbeats = new Map<FastifyReply, ReturnType<typeof setInterval>>();

  subscribe(eventId: string, reply: FastifyReply, subscriber: Subscriber) {
    let streams = this.subscribers.get(eventId);
    if (!streams) {
      streams = new Map();
      this.subscribers.set(eventId, streams);
    }
    streams.set(reply, { ...subscriber });

    // Comment frames keep proxies / load balancers from idling the socket out.
    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(": ping\n\n");
      } catch {
        this.unsubscribe(eventId, reply);
      }
    }, HEARTBEAT_MS);
    this.heartbeats.set(reply, heartbeat);

    reply.raw.on("close", () => this.unsubscribe(eventId, reply));
  }

  unsubscribe(eventId: string, reply: FastifyReply) {
    const streams = this.subscribers.get(eventId);
    streams?.delete(reply);
    if (streams && streams.size === 0) this.subscribers.delete(eventId);
    const timer = this.heartbeats.get(reply);
    if (timer) clearInterval(timer);
    this.heartbeats.delete(reply);
  }

  /** Every subscriber of the event. */
  publish(eventId: string, message: ServerMessage) {
    this.publishWhere(eventId, message, () => true);
  }

  /** One team's members, plus staff. */
  publishToTeam(eventId: string, teamId: string, message: ServerMessage) {
    this.publishWhere(eventId, message, (s) => s.isStaff || s.teamId === teamId);
  }

  /** Staff only. */
  publishToStaff(eventId: string, message: ServerMessage) {
    this.publishWhere(eventId, message, (s) => s.isStaff);
  }

  /**
   * A user joined or left a team: switch all of their open streams for this
   * event (several tabs or phones) so team messages follow them.
   */
  setUserTeam(eventId: string, userId: string, teamId: string | null) {
    const streams = this.subscribers.get(eventId);
    if (!streams) return;
    for (const subscriber of streams.values()) {
      if (subscriber.userId !== null && subscriber.userId === userId) {
        subscriber.teamId = teamId;
      }
    }
  }

  /** Write a single message to one subscriber - used for the connect-time snapshot. */
  send(eventId: string, reply: FastifyReply, message: ServerMessage) {
    try {
      reply.raw.write(`data: ${JSON.stringify(message)}\n\n`);
    } catch {
      this.unsubscribe(eventId, reply);
    }
  }

  /** Close every open stream (server shutdown). */
  dispose() {
    for (const [eventId, streams] of this.subscribers) {
      for (const reply of [...streams.keys()]) {
        this.unsubscribe(eventId, reply);
        try {
          reply.raw.end();
        } catch {
          // already gone
        }
      }
    }
  }

  private publishWhere(
    eventId: string,
    message: ServerMessage,
    include: (subscriber: Subscriber) => boolean
  ) {
    const streams = this.subscribers.get(eventId);
    if (!streams?.size) return;
    for (const [reply, subscriber] of [...streams]) {
      if (include(subscriber)) this.send(eventId, reply, message);
    }
  }
}
