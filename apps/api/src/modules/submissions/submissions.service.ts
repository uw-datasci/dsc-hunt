import type { Submission, TeamScore } from "@dsc-hunt/types";
import { HttpError } from "../events/events.service";
import { EventsRepository } from "../events/events.repository";
import { QuestionsRepository } from "../questions/questions.repository";
import { TeamsRepository } from "../teams/teams.repository";
import { SubmissionsRepository } from "./submissions.repository";
import { computeTeamScore } from "../../utils/scoring";
import type { CreateSubmissionInput, RealtimeDeps } from "./submissions.types";

export class SubmissionsService {
  constructor(
    private readonly submissions: SubmissionsRepository,
    private readonly teams: TeamsRepository,
    private readonly events: EventsRepository,
    private readonly questions: QuestionsRepository,
    private readonly realtime?: RealtimeDeps
  ) {}

  async submit(
    input: CreateSubmissionInput,
    userId: string
  ): Promise<{ submission: Submission; teamScore: TeamScore }> {
    const team = await this.teams.findById(input.teamId);
    if (!team) throw new HttpError(404, "Team not found");

    // Membership check
    const membership = await this.teams.getMembershipForUser(userId, team.eventId);
    if (membership?.team_id !== team.id) {
      throw new HttpError(403, "You're not on this team");
    }

    const event = await this.events.findById(team.eventId);
    if (!event) throw new HttpError(404, "Event not found");
    if (event.status !== "active") {
      throw new HttpError(400, "Event isn't active");
    }
    const now = Date.now();
    if (!event.startsAt || !event.endsAt) {
      throw new HttpError(400, "Event hasn't started");
    }
    if (now < Date.parse(event.startsAt) || now > Date.parse(event.endsAt)) {
      throw new HttpError(400, "Outside event window");
    }
    if (event.pausedAt) {
      throw new HttpError(400, "Event is paused");
    }

    const count = await this.submissions.countForTeam(team.id);
    if (count >= event.submissionCap) {
      throw new HttpError(409, "Submission limit reached");
    }

    // Validate the range
    if (
      !Number.isFinite(input.minValue) ||
      !Number.isFinite(input.maxValue) ||
      input.minValue <= 0 ||
      input.maxValue < input.minValue
    ) {
      throw new HttpError(400, "Invalid range");
    }

    const question = await this.questions.findById(input.questionId);
    if (question?.eventId !== event.id) throw new HttpError(404, "Question not found");

    const submission = await this.submissions.insert({
      teamId: team.id,
      questionId: input.questionId,
      userId,
      minValue: input.minValue,
      maxValue: input.maxValue,
    });

    const teamScore = await this.computeTeamScore(team.id, event.id);
    await this.broadcastSubmission(event.id, team, submission, teamScore, question.prompt);
    return { submission, teamScore };
  }

  private async broadcastSubmission(
    eventId: string,
    team: { id: string; code: string; name: string | null },
    submission: Submission,
    teamScore: TeamScore,
    questionPrompt: string
  ) {
    if (!this.realtime) return;
    const { hub, leaderboard } = this.realtime;
    hub.publish(eventId, {
      type: "team_score",
      eventId,
      teamId: team.id,
      score: teamScore.score,
      goodIntervals: teamScore.goodIntervals,
      submissionCount: teamScore.submissionCount,
      evaluations: teamScore.evaluations,
    });
    hub.publish(eventId, {
      type: "submission",
      eventId,
      teamId: team.id,
      teamCode: team.code,
      teamName: team.name,
      questionPrompt,
      submission: {
        id: submission.id,
        questionId: submission.questionId,
        userId: submission.userId,
        minValue: submission.minValue,
        maxValue: submission.maxValue,
        submittedAt: submission.submittedAt,
      },
    });
    await leaderboard.publishLeaderboard(eventId);

    const stats = await this.events.stats(eventId);
    hub.publish(eventId, { type: "event_stats", eventId, data: stats });
  }

  async listForTeam(teamId: string, userId: string): Promise<Submission[]> {
    const team = await this.teams.findById(teamId);
    if (!team) throw new HttpError(404, "Team not found");
    const membership = await this.teams.getMembershipForUser(userId, team.eventId);
    if (membership?.team_id !== team.id) {
      throw new HttpError(403, "Forbidden");
    }
    return this.submissions.listForTeam(teamId);
  }

  async getTeamScore(teamId: string): Promise<TeamScore> {
    const team = await this.teams.findById(teamId);
    if (!team) throw new HttpError(404, "Team not found");
    return this.computeTeamScore(team.id, team.eventId);
  }

  async computeTeamScore(teamId: string, eventId: string): Promise<TeamScore> {
    const [submissions, allQuestions, event] = await Promise.all([
      this.submissions.listForTeam(teamId),
      this.questions.listForEvent(eventId, {
        includeAnswer: true,
      }),
      this.events.findById(eventId),
    ]);
    if (!event) throw new HttpError(404, "Event not found");
    const result = computeTeamScore(
      submissions.map((s) => ({
        questionId: s.questionId,
        minValue: s.minValue,
        maxValue: s.maxValue,
        submittedAt: s.submittedAt,
      })),
      allQuestions.map((q) => ({ id: q.id, answer: q.answer ?? 0 })),
      event.questionCount
    );
    return { teamId, ...result };
  }
}
