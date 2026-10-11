import type { LeaderboardService } from "../leaderboard/leaderboard.service";
import type { EventHub } from "../realtime/event-hub";

export interface CreateSubmissionInput {
  teamId: string;
  questionId: string;
  minValue: number;
  maxValue: number;
}

export interface SubmissionRow {
  id: string;
  team_id: string;
  question_id: string;
  user_id: string;
  min_value: string;
  max_value: string;
  submitted_at: string;
}

export interface RealtimeDeps {
  hub: EventHub;
  leaderboard: LeaderboardService;
}
