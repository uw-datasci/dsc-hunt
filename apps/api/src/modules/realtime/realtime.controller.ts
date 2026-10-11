import type { FastifyReply, FastifyRequest } from "fastify";
import type { TeamsRepository } from "../teams/teams.repository";
import type { EventsRepository } from "../events/events.repository";
import type { EventHub } from "./event-hub";
import type { EditingPresenceStore } from "./editing-presence";

const MAX_NAME_LENGTH = 60;

interface SetEditingBody {
  teamId: string;
  questionId: string;
  editing: boolean;
  name: string;
  avatarUrl?: string | null;
}

export class RealtimeController {
  constructor(
    private readonly hub: EventHub,
    private readonly presence: EditingPresenceStore,
    private readonly teams: TeamsRepository,
    private readonly events: EventsRepository
  ) {
    this.stream = this.stream.bind(this);
    this.setEditing = this.setEditing.bind(this);
  }

  async setEditing(request: FastifyRequest, reply: FastifyReply) {
    const { id: eventId } = request.params as { id: string };
    const { teamId, questionId, editing, name, avatarUrl } = request.body as SetEditingBody;
    const user = request.user!;

    const membership = await this.teams.getMembershipForUser(user.id, eventId);
    if (membership?.team_id !== teamId) {
      return reply.code(403).send({ error: "You're not on this team" });
    }

    if (editing) {
      this.presence.touch(eventId, teamId, questionId, {
        userId: user.id,
        name: name.trim().slice(0, MAX_NAME_LENGTH) || "Teammate",
        avatarUrl: avatarUrl ?? null,
      });
    } else {
      this.presence.remove(eventId, teamId, questionId, user.id);
    }

    return reply.code(204).send();
  }

  async stream(request: FastifyRequest, reply: FastifyReply) {
    const { id: eventId } = request.params as { id: string };
    if (!request.user) return reply.code(401).send({ error: "Unauthenticated" });

    // Hijack skips Fastify onSend hooks, so @fastify/cors never writes headers.
    // EventSource is cross-origin from the web app and needs them on the raw response.
    reply.hijack();
    const origin = request.headers.origin;
    if (origin === request.server.config.CORS_ORIGIN) {
      reply.raw.setHeader("Access-Control-Allow-Origin", origin);
      reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
      reply.raw.setHeader("Vary", "Origin");
    }
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.setHeader("X-Accel-Buffering", "no");
    reply.raw.flushHeaders();

    this.hub.subscribe(eventId, reply);

    // Snapshot the current status immediately so a client that just
    // (re)connected - e.g. after a dropped wifi connection - self-heals to
    // the true paused/running state instead of waiting for the next admin
    // action to broadcast.
    const event = await this.events.findById(eventId);
    if (event) {
      this.hub.send(eventId, reply, {
        type: "event_status",
        eventId,
        status: event.status,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        pausedAt: event.pausedAt,
      });
    }
  }
}
