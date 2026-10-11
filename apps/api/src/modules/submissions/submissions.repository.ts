import { query, queryOne } from "@dsc-hunt/db";
import type { Submission } from "@dsc-hunt/types";
import type { SubmissionRow } from "./submissions.types";

function rowToSubmission(row: SubmissionRow): Submission {
  return {
    id: Number(row.id),
    teamId: row.team_id,
    questionId: row.question_id,
    userId: row.user_id,
    minValue: Number(row.min_value),
    maxValue: Number(row.max_value),
    submittedAt: row.submitted_at,
  };
}

export class SubmissionsRepository {
  async insert(input: {
    teamId: string;
    questionId: string;
    userId: string;
    minValue: number;
    maxValue: number;
  }): Promise<Submission> {
    const row = await queryOne<SubmissionRow>(
      `INSERT INTO submissions
         (team_id, question_id, user_id, min_value, max_value)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.teamId, input.questionId, input.userId, input.minValue, input.maxValue]
    );
    if (!row) throw new Error("Insert returned no row");
    return rowToSubmission(row);
  }

  async listForTeam(teamId: string): Promise<Submission[]> {
    const rows = await query<SubmissionRow>(
      `SELECT * FROM submissions WHERE team_id = $1 ORDER BY submitted_at DESC`,
      [teamId]
    );
    return rows.map(rowToSubmission);
  }

  async countForTeam(teamId: string): Promise<number> {
    const row = await queryOne<{ count: string }>(
      `SELECT count(*)::text AS count FROM submissions WHERE team_id = $1`,
      [teamId]
    );
    return row ? Number(row.count) : 0;
  }

  async listForEvent(eventId: string): Promise<Submission[]> {
    const rows = await query<SubmissionRow>(
      `SELECT s.* FROM submissions s
       JOIN teams t ON t.id = s.team_id
       WHERE t.event_id = $1
       ORDER BY s.submitted_at DESC`,
      [eventId]
    );
    return rows.map(rowToSubmission);
  }
}
