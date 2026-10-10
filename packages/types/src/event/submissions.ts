export interface Submission {
  id: number;
  teamId: string;
  questionId: string;
  userId: string;
  minValue: number;
  maxValue: number;
  submittedAt: string;
}
