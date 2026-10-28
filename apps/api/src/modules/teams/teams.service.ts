import {
  isStaffRole,
  type AdminTeam,
  type AuthenticatedUser,
  type Event,
  type Team,
  type TeamMember,
  type TeamWithMembers,
} from "@dsc-hunt/types";
import { HttpError } from "../../lib/http-error";
import type { EventsRepository } from "../events/events.repository";
import type { EventHub } from "../realtime/event-hub";
import type { StatsPublisher } from "../stats/stats.publisher";
import type { TeamsRepository } from "./teams.repository";

const CODE_MIN = 10_000;
const CODE_MAX = 99_999;
const CODE_ATTEMPTS = 25;
const DISPLAY_NAME_MAX = 200;

const CODE_TAKEN = "teams_event_code_key";
const ALREADY_ON_TEAM = "team_members_event_user_key";
const ALREADY_MEMBER = "team_members_pkey";

function generateCode(): string {
  return String(Math.floor(Math.random() * (CODE_MAX - CODE_MIN + 1)) + CODE_MIN);
}

/** Postgres unique violation on a specific constraint. */
function isUniqueViolation(error: unknown, constraint: string): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, constraint: name } = error as { code?: string; constraint?: string };
  return code === "23505" && name === constraint;
}

/** Profile name, then the email's local part, then a generic fallback. */
function displayNameFor(user: AuthenticatedUser): string {
  const fullName = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  const name = fullName || user.email?.split("@")[0]?.trim() || "Player";
  return name.slice(0, DISPLAY_NAME_MAX);
}

export class TeamsService {
  constructor(
    private readonly repository: TeamsRepository,
    private readonly events: EventsRepository,
    private readonly hub: EventHub,
    private readonly stats: StatsPublisher | null = null
  ) {}

  async create(eventId: string, user: AuthenticatedUser, name?: string): Promise<Team> {
    await this.requireOpenEvent(eventId);
    if (await this.repository.getTeamForUser(user.id, eventId)) {
      throw new HttpError(409, "You're already on a team for this event");
    }

    // Retry on code collisions; the unique constraint is the source of truth.
    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
      const code = generateCode();
      try {
        const team = await this.repository.createWithCreator({
          eventId,
          code,
          name: name?.trim() || `Team ${code}`,
          creatorUserId: user.id,
          creatorDisplayName: displayNameFor(user),
        });
        this.hub.setUserTeam(eventId, user.id, team.id);
        await this.publishRoster(eventId, team.id);
        return team;
      } catch (error) {
        if (isUniqueViolation(error, CODE_TAKEN)) continue;
        if (isUniqueViolation(error, ALREADY_ON_TEAM)) {
          throw new HttpError(409, "You're already on a team for this event");
        }
        throw error;
      }
    }
    throw new HttpError(500, "Could not generate a unique team code");
  }

  async joinByCode(eventId: string, code: string, user: AuthenticatedUser): Promise<Team> {
    const event = await this.requireOpenEvent(eventId);

    const team = await this.repository.findByCode(eventId, code);
    if (!team) throw new HttpError(404, "No team with that code");

    const existing = await this.repository.getTeamForUser(user.id, eventId);
    if (existing) {
      if (existing.id === team.id) return team;
      throw new HttpError(409, "You're already on another team for this event");
    }

    let result;
    try {
      result = await this.repository.addMember({
        teamId: team.id,
        eventId,
        userId: user.id,
        displayName: displayNameFor(user),
        sizeCap: event.teamSizeCap,
      });
    } catch (error) {
      // A racing request (double click, second tab) got the user onto a team first.
      if (
        isUniqueViolation(error, ALREADY_ON_TEAM) ||
        isUniqueViolation(error, ALREADY_MEMBER)
      ) {
        const now = await this.repository.getTeamForUser(user.id, eventId);
        if (now?.id === team.id) return team;
        throw new HttpError(409, "You're already on another team for this event");
      }
      throw error;
    }

    if (result === "missing") throw new HttpError(404, "No team with that code");
    if (result === "full") throw new HttpError(409, "Team is full");

    // Point the joiner's open streams at the team first, so they get the roster too.
    this.hub.setUserTeam(eventId, user.id, team.id);
    await this.publishRoster(eventId, team.id);
    return team;
  }

  async leave(teamId: string, userId: string): Promise<void> {
    const team = await this.repository.findById(teamId);
    if (!team) throw new HttpError(404, "Team not found");

    const event = await this.events.findById(team.eventId);
    if (event && (event.status === "live" || event.status === "ended")) {
      throw new HttpError(400, "Can't leave during or after the game");
    }

    await this.repository.removeMember(teamId, userId);
    this.hub.setUserTeam(team.eventId, userId, null);
    await this.publishRoster(team.eventId, teamId);
  }

  /** Members and staff only: the response includes the join code. */
  async getDetail(
    teamId: string,
    user: AuthenticatedUser
  ): Promise<{ team: Team; members: TeamMember[] }> {
    const team = await this.repository.findById(teamId);
    if (!team) throw new HttpError(404, "Team not found");
    if (!isStaffRole(user.role) && !(await this.repository.isMember(teamId, user.id))) {
      throw new HttpError(403, "You are not on this team");
    }
    return { team, members: await this.repository.listMembers(teamId) };
  }

  /** The caller's team for an event, or null if they haven't joined one. */
  async getMine(eventId: string, userId: string): Promise<TeamWithMembers | null> {
    await this.requireEvent(eventId);
    const team = await this.repository.getTeamForUser(userId, eventId);
    if (!team) return null;
    return { ...team, members: await this.repository.listMembers(team.id) };
  }

  // --- Admin (staff-only routes) ---

  async listForAdmin(eventId: string): Promise<AdminTeam[]> {
    await this.requireEvent(eventId);
    return this.repository.listForEventAdmin(eventId);
  }

  /**
   * Removes a player from a team, in any event status. Before the start an
   * emptied team is deleted (like players leaving); once live it's kept, so
   * its scans and leaderboard place survive.
   */
  async adminRemoveMember(eventId: string, teamId: string, userId: string): Promise<void> {
    const event = await this.requireEvent(eventId);
    await this.requireTeamInEvent(eventId, teamId);

    const removed = await this.repository.removeMember(
      teamId,
      userId,
      event.status === "not_started"
    );
    if (!removed) throw new HttpError(404, "That player isn't on this team");

    // Roster first, while the removed player's streams still follow the team,
    // so their lobby sees they're gone. Then stop sending them team messages.
    await this.publishRoster(eventId, teamId);
    this.hub.setUserTeam(eventId, userId, null);
  }

  /** Deletes a team and its memberships. Only before the start. */
  async adminDeleteTeam(eventId: string, teamId: string): Promise<void> {
    const event = await this.requireEvent(eventId);
    await this.requireTeamInEvent(eventId, teamId);
    if (event.status !== "not_started") {
      throw new HttpError(409, "Teams can only be deleted before the hunt starts");
    }

    const members = await this.repository.listMembers(teamId);
    // Tell open lobbies the team is empty before cutting their streams off.
    this.hub.publishToTeam(eventId, teamId, {
      type: "team_members",
      eventId,
      teamId,
      members: [],
    });
    await this.repository.delete(teamId);
    for (const member of members) this.hub.setUserTeam(eventId, member.userId, null);
    await this.stats?.publish(eventId);
  }

  /** Renames a team in any status (e.g. moderating an inappropriate name). */
  async adminRename(eventId: string, teamId: string, name: string): Promise<Team> {
    const trimmed = name.trim();
    if (!trimmed) throw new HttpError(400, "Team name can't be blank");
    await this.requireEvent(eventId);
    await this.requireTeamInEvent(eventId, teamId);
    const team = await this.repository.rename(teamId, trimmed);
    if (!team) throw new HttpError(404, "Team not found");
    return team;
  }

  private async requireTeamInEvent(eventId: string, teamId: string): Promise<Team> {
    const team = await this.repository.findById(teamId);
    if (!team || team.eventId !== eventId) throw new HttpError(404, "Team not found");
    return team;
  }

  private async requireEvent(eventId: string): Promise<Event> {
    const event = await this.events.findById(eventId);
    if (!event) throw new HttpError(404, "Event not found");
    return event;
  }

  /** Teams can be created and joined before and during the hunt, not after. */
  private async requireOpenEvent(eventId: string): Promise<Event> {
    const event = await this.requireEvent(eventId);
    if (event.status === "ended") throw new HttpError(400, "The hunt has ended");
    return event;
  }

  /** Tells the team's lobby who's on it (team + staff), and staff the new counts. */
  private async publishRoster(eventId: string, teamId: string): Promise<void> {
    const members = await this.repository.listMembers(teamId);
    this.hub.publishToTeam(eventId, teamId, { type: "team_members", eventId, teamId, members });
    await this.stats?.publish(eventId);
  }
}
