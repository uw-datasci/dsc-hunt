import type { LeaderboardEntry } from "@dsc-hunt/types";

import { HttpError } from "../events/events.service";
import { EventsRepository } from "../events/events.repository";
import { QuestionsRepository } from "../questions/questions.repository";
import { SubmissionsRepository } from "../submissions/submissions.repository";
import { TeamsRepository } from "../teams/teams.repository";
import { computeTeamScore } from "../../utils/scoring";

import type { EventHub } from "../realtime/event-hub";

export class LeaderboardService {
  constructor(
    private readonly teams: TeamsRepository,
    private readonly submissions: SubmissionsRepository,
    private readonly questions: QuestionsRepository,
    private readonly events: EventsRepository,
    private readonly hub?: EventHub
  ) {}

  async getLeaderboard(eventId: string): Promise<LeaderboardEntry[]> {
    const event = await this.events.findById(eventId);

    if (!event) {
      throw new HttpError(404, "Event not found");
    }

    const [teamList, allQuestions] = await Promise.all([
      this.teams.listForEvent(eventId),
      this.questions.listForEvent(eventId, {
        includeAnswer: true,
      }),
    ]);

    const questionInputs = allQuestions.map((q) => ({
      id: q.id,
      answer: q.answer ?? 0,
    }));

    const entries: LeaderboardEntry[] = await Promise.all(
      teamList.map(async (team) => {
        const [subs, memberRows] = await Promise.all([
          this.submissions.listForTeam(team.id),
          this.teams.listMembers(team.id),
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
          teamId: team.id,
          code: team.code,
          name: team.name,
          score: scored.score,
          goodIntervals: scored.goodIntervals,
          submissionCount: scored.submissionCount,
          members: memberRows.map((m) => ({
            id: m.user_id,
            firstName: null,
            lastName: null,
          })),
        };
      })
    );

    return entries.sort(
      (a, b) =>
        a.score - b.score ||
        b.goodIntervals - a.goodIntervals ||
        a.submissionCount - b.submissionCount
    );
  }

  async publishLeaderboard(eventId: string): Promise<LeaderboardEntry[]> {
    const data = await this.getLeaderboard(eventId);

    this.hub?.publish(eventId, {
      type: "leaderboard",
      eventId,
      data,
    });

    return data;
  }
}
