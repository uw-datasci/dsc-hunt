import type { Team } from "@dsc-hunt/types";
import { HttpError } from "../events/events.service";
import { EventsRepository } from "../events/events.repository";
import { QuestionsRepository } from "../questions/questions.repository";
import { computeTeamScore } from "../../utils/scoring";
import type { EventHub } from "../realtime/event-hub";
import { SubmissionsRepository } from "../submissions/submissions.repository";
import { TeamsRepository } from "./teams.repository";
import type { AdminTeamDetail, CreateTeamInput } from "./teams.types";

const CODE_MIN = 10_000;
const CODE_MAX = 99_999;
const CODE_ATTEMPTS = 25;

function generateCode(): string {
  return String(Math.floor(Math.random() * (CODE_MAX - CODE_MIN + 1)) + CODE_MIN);
}

async function assertTeamOperationsAllowed(events: EventsRepository, eventId: string) {
  const event = await events.findById(eventId);
  if (!event) throw new HttpError(404, "Event not found");
  if (event.status !== "active") {
    throw new HttpError(400, "Event isn't open");
  }
  return event;
}

export class TeamsService {
  constructor(
    private readonly repository: TeamsRepository,
    private readonly events: EventsRepository,
    private readonly submissions?: SubmissionsRepository,
    private readonly questions?: QuestionsRepository,
    private readonly hub?: EventHub
  ) {}

  /** Recompute and broadcast live join/progress counters after a roster change. */
  private async publishStats(eventId: string) {
    if (!this.hub) return;
    const stats = await this.events.stats(eventId);
    this.hub.publish(eventId, { type: "event_stats", eventId, data: stats });
  }

  async create(eventId: string, userId: string, input: CreateTeamInput): Promise<Team> {
    const event = await assertTeamOperationsAllowed(this.events, eventId);

    const existingMembership = await this.repository.getMembershipForUser(userId, eventId);
    if (existingMembership) {
      throw new HttpError(409, "You're already on a team for this event");
    }

    // Generate a unique 5-digit code with retry on collision
    let code: string | null = null;
    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
      const candidate = generateCode();
      const exists = await this.repository.codeExists(event.id, candidate);
      if (!exists) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new HttpError(500, "Could not generate a unique team code");

    const team = await this.repository.createWithCreator({
      eventId: event.id,
      code,
      name: input.name?.trim() || null,
      creatorUserId: userId,
    });
    await this.publishStats(event.id);
    return team;
  }

  async joinByCode(eventId: string, code: string, userId: string): Promise<Team> {
    const event = await assertTeamOperationsAllowed(this.events, eventId);

    const team = await this.repository.findByCode(event.id, code);
    if (!team) throw new HttpError(404, "No team with that code");

    const existingMembership = await this.repository.getMembershipForUser(userId, event.id);
    if (existingMembership) {
      if (existingMembership.team_id === team.id) return team;
      throw new HttpError(409, "You're already on another team for this event");
    }

    const size = await this.repository.countMembers(team.id);
    if (size >= event.teamSizeCap) {
      throw new HttpError(409, "Team is full");
    }

    await this.repository.addMember({
      teamId: team.id,
      eventId: event.id,
      userId,
    });
    await this.publishStats(event.id);
    return team;
  }

  async leave(teamId: string, userId: string): Promise<void> {
    const team = await this.repository.findById(teamId);
    if (!team) throw new HttpError(404, "Team not found");
    const event = await this.events.findById(team.eventId);
    if (event && (event.status === "active" || event.status === "ended"))
      throw new HttpError(400, "Can't leave during or after the game");

    await this.repository.removeMember(teamId, userId);
    await this.repository.deleteIfEmpty(teamId);
    await this.publishStats(team.eventId);
  }

  async getDetail(
    teamId: string
  ): Promise<{ team: Team; members: { userId: string; joinedAt: string }[] }> {
    const team = await this.repository.findById(teamId);
    if (!team) throw new HttpError(404, "Team not found");
    const rows = await this.repository.listMembers(teamId);
    return {
      team,
      members: rows.map((r) => ({ userId: r.user_id, joinedAt: r.joined_at })),
    };
  }

  async listForEventAdmin(eventId: string): Promise<AdminTeamDetail[]> {
    if (!this.submissions || !this.questions) {
      throw new HttpError(500, "Admin teams not configured");
    }
    const event = await this.events.findById(eventId);
    if (!event) throw new HttpError(404, "Event not found");

    const teams = await this.repository.listForEvent(eventId);
    const allQuestions = await this.questions.listForEvent(eventId, {
      includeAnswer: true,
    });
    const questionInputs = allQuestions.map((q) => ({
      id: q.id,
      answer: q.answer ?? 0,
    }));

    return Promise.all(
      teams.map(async (team) => {
        const [memberRows, subs] = await Promise.all([
          this.repository.listMembers(team.id),
          this.submissions!.listForTeam(team.id),
        ]);
        const scored = computeTeamScore(
          subs.map((s) => ({
            questionId: s.questionId,
            minValue: s.minValue,
            maxValue: s.maxValue,
            submittedAt: s.submittedAt,
          })),
          questionInputs,
          event.questionCount
        );
        return {
          team,
          members: memberRows.map((r) => ({
            userId: r.user_id,
            joinedAt: r.joined_at,
          })),
          score: { teamId: team.id, ...scored },
        };
      })
    );
  }
}
