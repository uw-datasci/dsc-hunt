/**
 * Pure scoring functions. No DB calls, no side effects - easy to unit test.
 *
 * Formula (golf-style, lower = better):
 *   For each question that has a "good" latest submission (min ≤ answer ≤ max),
 *   add max/min to totalRatio.
 *   score = round((10 + totalRatio) * 2 ^ (questionCount − goodIntervals))
 */

/* ========================================================================== *
 *  Types
 * ========================================================================== */

interface ScoringSubmission {
  questionId: string;
  minValue: number;
  maxValue: number;
  submittedAt: string;
}

interface ScoringQuestion {
  id: string;
  answer: number;
}

export interface QuestionEvaluation {
  questionId: string;
  correct: boolean;
}

interface ScoreResult {
  score: number;
  goodIntervals: number;
  submissionCount: number;
  evaluations: QuestionEvaluation[];
}

/* ========================================================================== *
 *  Functions
 * ========================================================================== */

/**
 * Reduce a list of submissions to the most recent one per question.
 */
export function latestSubmissionsPerQuestion(
  submissions: ScoringSubmission[]
): ScoringSubmission[] {
  const byQuestion = new Map<string, ScoringSubmission>();
  for (const s of submissions) {
    const existing = byQuestion.get(s.questionId);
    if (!existing || s.submittedAt > existing.submittedAt) {
      byQuestion.set(s.questionId, s);
    }
  }
  return [...byQuestion.values()];
}

export function computeTeamScore(
  submissions: ScoringSubmission[],
  questions: ScoringQuestion[],
  questionCount: number
): ScoreResult {
  const answers = new Map(questions.map((q) => [q.id, q.answer]));
  const latest = latestSubmissionsPerQuestion(submissions);

  let goodIntervals = 0;
  let totalRatio = 0;
  const evaluations: QuestionEvaluation[] = [];

  for (const s of latest) {
    const answer = answers.get(s.questionId);
    if (answer === undefined) continue;
    const correct = s.minValue <= answer && answer <= s.maxValue;
    evaluations.push({ questionId: s.questionId, correct });
    if (correct) {
      goodIntervals++;
      totalRatio += s.maxValue / s.minValue;
    }
  }

  const baseScore = 10 + totalRatio;
  const multiplier = Math.pow(2, Math.max(0, questionCount - goodIntervals));
  return {
    score: Math.round(baseScore * multiplier),
    goodIntervals,
    submissionCount: submissions.length,
    evaluations,
  };
}
