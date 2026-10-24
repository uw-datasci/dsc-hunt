import type { RiddleStatus, RiddlesResponse, ScanResponse } from "@dsc-hunt/types";
import { HttpError } from "../../lib/http-error";
import type { EventsRepository } from "../events/events.repository";
import type { EventHub } from "../realtime/event-hub";
import type { RiddlesRepository } from "./riddles.repository";
import type { ProgressRow, TeamStateRow } from "./riddles.types";

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
    private readonly hub: EventHub
  ) {}

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

      const expectedAnswer = (await this.repository.findAnswer(eventId, position))?.trim();
      if (!expectedAnswer) throw new HttpError(409, "This riddle is not configured yet");
      if (answer.trim().toLowerCase() !== expectedAnswer.toLowerCase()) {
        throw new HttpError(400, "Incorrect answer");
      }

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
      if (status === "visited") throw new HttpError(409, "Already scanned");
      if (status !== "solved") throw new HttpError(409, "Solve the riddle first");

      const recorded = await this.repository.recordVisit(
        teamId,
        eventId,
        location,
        this.scoreVisit()
      );
      if (!recorded) {
        const state = await this.getTeamState(teamId);
        if (getRiddleStatus(state, location.position) === "visited") {
          throw new HttpError(409, "Already scanned");
        }
        throw new HttpError(409, "Solve the riddle first");
      }

      return {
        locationName: location.name,
        progress: this.publishProgress(await this.getProgressForTeam(eventId, teamId)),
      };
    });
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
      })),
      activeRiddle: rows[0]?.active_riddle ?? null,
    };
  }

  /** Tells every teammate's open riddle board that the team's progress changed. */
  private publishProgress(progress: RiddlesResponse): RiddlesResponse {
    this.hub.publish(progress.eventId, {
      type: "team_progress",
      eventId: progress.eventId,
      teamId: progress.teamId,
      riddles: progress.riddles.map(({ position, status }) => ({ position, status })),
      activeRiddle: progress.activeRiddle,
    });
    return progress;
  }

  private scoreVisit(): number {
    // TODO: replace this placeholder with the scoring function from issue #10.
    return 0;
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
