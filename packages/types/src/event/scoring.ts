import type { Profile } from "../auth/user.js";

export interface QuestionEvaluation {
  questionId: string;
  correct: boolean;
}

export interface TeamScore {
  teamId: string;
  score: number;
  goodIntervals: number;
  submissionCount: number;
  evaluations: QuestionEvaluation[];
}

export interface LeaderboardEntry extends Omit<TeamScore, "evaluations"> {
  code: string;
  name: string | null;
  members: Array<Pick<Profile, "firstName" | "lastName"> & { id: string }>;
}
