import { withTransaction } from "@dsc-hunt/db";
import type { RiddleStatus, RiddlesResponse, ScanResponse, TeamVisit } from "@dsc-hunt/types";
import { HttpError } from "../../lib/http-error";
import type { EventsRepository } from "../events/events.repository";
import type { EventHub } from "../realtime/event-hub";
import type { ScoringService } from "../scoring/scoring.service";
import type { StatsPublisher } from "../stats/stats.publisher";
import { SIGNED_URL_SECONDS, type ObjectStorage } from "../../plugins/storage";
import { matchesAnswer } from "./answer-match";
import type { RiddlesRepository } from "./riddles.repository";
import type { LocationRow, ProgressRow, TeamStateRow } from "./riddles.types";

function getRiddleStatus(team: TeamStateRow, position: number): RiddleStatus {
  switch (position) {
    case 1:
      return team.riddle_1;
    case 2:
      return team.riddle_2;
    case 3:
      return team.riddle_3;
    case 4:
      return team.riddle_4;
    case 5:
      return team.riddle_5;
    case 6:
      return team.riddle_6;
    default:
      throw new HttpError(400, "Invalid riddle position");
  }
}

export class RiddlesService {
  private readonly teamLocks = new Map<string, Promise<void>>();

  constructor(
    private readonly repository: RiddlesRepository,
    private readonly events: EventsRepository,
    private readonly hub: EventHub,
    private readonly scoring: ScoringService,
    private readonly storage: ObjectStorage | null = null,
    private readonly stats: StatsPublisher | null = null
  ) {}

  /** The caller's team's scans (location + points), for the results screen. Any status. */
  async teamVisits(eventId: string, userId: string): Promise<TeamVisit[]> {
    await this.requireEvent(eventId);
    const teamId = await this.requireTeam(eventId, userId);
    return this.repository.findTeamVisits(teamId);
  }

  /**
   * A short-lived signed URL for a riddle's image, only for a card the
   * caller's team has revealed (same rule as the riddle text).
   */
  async imageUrl(eventId: string, position: number, userId: string): Promise<string> {
    if (!this.storage) throw new HttpError(503, "Image storage isn't configured");
    await this.requireEvent(eventId);
    const teamId = await this.requireTeam(eventId, userId);
    const key = await this.repository.findRevealedImageKey(teamId, position);
    if (!key) throw new HttpError(404, "No image for this riddle");
    return this.storage.signedGetUrl(key, SIGNED_URL_SECONDS);
  }

  /** Id of the current hunt - the newest event, matching `GET /events/current`. */
  async getCurrentEventId(): Promise<string> {
    const event = await this.events.findCurrent();
    if (!event) throw new HttpError(404, "No event exists yet");
    return event.id;
  }

  async getCurrentProgress(userId: string): Promise<RiddlesResponse> {
    return this.getProgress(await this.getCurrentEventId(), userId);
  }

  async getProgress(eventId: string, userId: string): Promise<RiddlesResponse> {
    await this.requireEvent(eventId);
    const teamId = await this.requireTeam(eventId, userId);
    return this.getProgressForTeam(eventId, teamId);
  }

  async flip(eventId: string, position: number, userId: string): Promise<RiddlesResponse> {
    const teamId = await this.requireLiveTeam(eventId, userId);
    return this.withTeamLock(teamId, async () => {
      if (!(await this.repository.activate(teamId, eventId, position))) {
        const state = await this.getTeamState(teamId);
        if (state.active_riddle !== null)
          throw new HttpError(409, "A riddle is already active");
        throw new HttpError(409, "This riddle is no longer unvisited");
      }
      return this.publishProgress(await this.getProgressForTeam(eventId, teamId));
    });
  }

  async answer(
    eventId: string,
    position: number,
    answer: string,
    userId: string
  ): Promise<RiddlesResponse> {
    const teamId = await this.requireLiveTeam(eventId, userId);
    return this.withTeamLock(teamId, async () => {
      const team = await this.getTeamState(teamId);
      if (team.active_riddle !== position) {
        throw new HttpError(409, "This riddle is not active");
      }
      if (getRiddleStatus(team, position) !== "unvisited") {
        throw new HttpError(409, "This riddle is no longer unvisited");
      }

      if (!(await this.repository.recordAnswerAttempt(teamId, eventId, position))) {
        const attempt = await this.repository.findAnswerAttemptState(teamId, position);
        const stillActive =
          attempt?.active_riddle === position && attempt.status === "unvisited";
        if (stillActive && attempt.cooling_down) {
          throw new HttpError(429, "Please wait before trying another answer");
        }
        throw new HttpError(409, "This riddle is no longer active");
      }

      const accepted = await this.repository.findAnswers(eventId, position);
      if (accepted.length === 0) throw new HttpError(409, "This riddle is not configured yet");
      if (!matchesAnswer(answer, accepted)) throw new HttpError(400, "Incorrect answer");

      if (!(await this.repository.markSolved(teamId, eventId, position))) {
        throw new HttpError(409, "This riddle is no longer active");
      }
      return this.publishProgress(await this.getProgressForTeam(eventId, teamId));
    });
  }

  async scan(eventId: string, code: string, userId: string): Promise<ScanResponse> {
    const teamId = await this.requireLiveTeam(eventId, userId);
    return this.withTeamLock(teamId, async () => {
      const location = await this.repository.findLocationByCode(eventId, code);
      if (!location) throw new HttpError(404, "Unknown QR code");

      const team = await this.getTeamState(teamId);
      const status = getRiddleStatus(team, location.position);
      if (status === "visited") return this.alreadyScanned(eventId, teamId, location);
      if (status !== "solved") throw new HttpError(409, "Solve the riddle first");

      // Mark the riddle visited and score the visit atomically. Every scan
      // locks its team row and then the location row, so there's no deadlock.
      const scored = await withTransaction(async (tx) => {
        if (!(await this.repository.markVisited(tx, teamId, eventId, location.position))) {
          return null;
        }
        return this.scoring.scoreVisit(eventId, teamId, location.location_id, tx);
      });

      if (!scored) {
        const state = await this.getTeamState(teamId);
        if (getRiddleStatus(state, location.position) === "visited") {
          return this.alreadyScanned(eventId, teamId, location);
        }
        throw new HttpError(409, "Solve the riddle first");
      }

      await this.stats?.publish(eventId);
      return {
        locationName: location.name,
        alreadyScanned: false,
        points: scored.points,
        totalScore: scored.totalScore,
        progress: this.publishProgress(await this.getProgressForTeam(eventId, teamId)),
      };
    });
  }

  /** A re-scan by a team that already found this location: report, don't award. */
  private async alreadyScanned(
    eventId: string,
    teamId: string,
    location: LocationRow
  ): Promise<ScanResponse> {
    const prior = await this.repository.findPriorVisit(teamId, location.location_id);
    return {
      locationName: location.name,
      alreadyScanned: true,
      points: prior?.points ?? 0,
      totalScore: prior?.total_score ?? 0,
      progress: await this.getProgressForTeam(eventId, teamId),
    };
  }

  private async requireLiveTeam(eventId: string, userId: string): Promise<string> {
    const teamId = await this.requireTeam(eventId, userId);
    const event = await this.requireEvent(eventId);
    if (event.status !== "live") throw new HttpError(409, "Event is not live");
    return teamId;
  }

  private async requireEvent(eventId: string) {
    const event = await this.events.findById(eventId);
    if (!event) throw new HttpError(404, "Event not found");
    return event;
  }

  private async requireTeam(eventId: string, userId: string): Promise<string> {
    const teamIds = await this.repository.findTeamIdsForUser(eventId, userId);
    if (teamIds.length === 0) throw new HttpError(403, "You are not on a team for this event");
    if (teamIds.length > 1)
      throw new HttpError(409, "You belong to multiple teams for this event");
    return teamIds[0]!;
  }

  private async getTeamState(teamId: string): Promise<TeamStateRow> {
    const team = await this.repository.findTeamState(teamId);
    if (!team) throw new HttpError(404, "Team not found");
    return team;
  }

  private async getProgressForTeam(eventId: string, teamId: string): Promise<RiddlesResponse> {
    const rows = await this.repository.findProgress(teamId);
    return this.toProgressResponse(eventId, teamId, rows);
  }

  private toProgressResponse(
    eventId: string,
    teamId: string,
    rows: ProgressRow[]
  ): RiddlesResponse {
    return {
      eventId,
      teamId,
      riddles: rows.map((row) => ({
        position: Number(row.position),
        status: row.status,
        text: row.text,
        hasImage: row.has_image,
      })),
      activeRiddle: rows[0]?.active_riddle ?? null,
    };
  }

  /** Tells every teammate's open riddle board that the team's progress changed. */
  private publishProgress(progress: RiddlesResponse): RiddlesResponse {
    this.hub.publishToTeam(progress.eventId, progress.teamId, {
      type: "team_progress",
      eventId: progress.eventId,
      teamId: progress.teamId,
      riddles: progress.riddles.map(({ position, status }) => ({ position, status })),
      activeRiddle: progress.activeRiddle,
    });
    return progress;
  }

  private async withTeamLock<T>(teamId: string, action: () => Promise<T>): Promise<T> {
    const previous = this.teamLocks.get(teamId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.teamLocks.set(teamId, current);
    await previous;

    try {
      return await action();
    } finally {
      release();
      if (this.teamLocks.get(teamId) === current) this.teamLocks.delete(teamId);
    }
  }
}
