import { pool, query, queryOne, transaction } from "@dsc-hunt/db";
import type { Team } from "@dsc-hunt/types";
import type { TeamMemberRow, TeamRow } from "./teams.types";

export class TeamsRepository {
  private static rowToTeam(row: TeamRow): Team {
    return {
      id: row.id,
      eventId: row.event_id,
      code: row.code,
      name: row.name,
      createdAt: row.created_at,
    };
  }

  async findById(id: string): Promise<Team | null> {
    const row = await queryOne<TeamRow>(`SELECT * FROM teams WHERE id = $1`, [id]);
    return row ? TeamsRepository.rowToTeam(row) : null;
  }

  async listForEvent(eventId: string): Promise<Team[]> {
    const rows = await query<TeamRow>(
      `SELECT * FROM teams WHERE event_id = $1 ORDER BY created_at ASC`,
      [eventId]
    );
    return rows.map(TeamsRepository.rowToTeam);
  }

  async findByCode(eventId: string, code: string): Promise<Team | null> {
    const row = await queryOne<TeamRow>(
      `SELECT * FROM teams WHERE event_id = $1 AND code = $2`,
      [eventId, code]
    );
    return row ? TeamsRepository.rowToTeam(row) : null;
  }

  async codeExists(eventId: string, code: string): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM teams WHERE event_id = $1 AND code = $2) AS exists`,
      [eventId, code]
    );
    return row?.exists ?? false;
  }

  async getMembershipForUser(userId: string, eventId: string): Promise<TeamMemberRow | null> {
    return queryOne<TeamMemberRow>(
      `SELECT * FROM team_members WHERE user_id = $1 AND event_id = $2`,
      [userId, eventId]
    );
  }

  /** The user's team for a given event, if any. */
  async getTeamForUser(userId: string, eventId: string): Promise<Team | null> {
    const row = await queryOne<TeamRow>(
      `SELECT t.* FROM teams t
       JOIN team_members m ON m.team_id = t.id
       WHERE m.user_id = $1 AND m.event_id = $2`,
      [userId, eventId]
    );
    return row ? TeamsRepository.rowToTeam(row) : null;
  }

  async countMembers(teamId: string): Promise<number> {
    const row = await queryOne<{ count: string }>(
      `SELECT count(*)::text AS count FROM team_members WHERE team_id = $1`,
      [teamId]
    );
    return row ? Number(row.count) : 0;
  }

  async listMembers(teamId: string): Promise<TeamMemberRow[]> {
    return query<TeamMemberRow>(
      `SELECT * FROM team_members WHERE team_id = $1 ORDER BY joined_at ASC`,
      [teamId]
    );
  }

  /**
   * Create a team + add the creator as the first member, atomically.
   */
  async createWithCreator(input: {
    eventId: string;
    code: string;
    name: string | null;
    creatorUserId: string;
  }): Promise<Team> {
    return transaction(async (tx) => {
      const [teamRow] = await tx.query<TeamRow>(
        `INSERT INTO teams (event_id, code, name) VALUES ($1, $2, $3) RETURNING *`,
        [input.eventId, input.code, input.name]
      );
      if (!teamRow) throw new Error("Insert team returned no row");
      await tx.query(
        `INSERT INTO team_members (team_id, event_id, user_id) VALUES ($1, $2, $3)`,
        [teamRow.id, input.eventId, input.creatorUserId]
      );
      return TeamsRepository.rowToTeam(teamRow);
    });
  }

  async addMember(input: { teamId: string; eventId: string; userId: string }): Promise<void> {
    await pool.query(
      `INSERT INTO team_members (team_id, event_id, user_id) VALUES ($1, $2, $3)`,
      [input.teamId, input.eventId, input.userId]
    );
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await pool.query(`DELETE FROM team_members WHERE team_id = $1 AND user_id = $2`, [
      teamId,
      userId,
    ]);
  }

  /** Delete the team if it has no members. */
  async deleteIfEmpty(teamId: string): Promise<void> {
    await pool.query(
      `DELETE FROM teams WHERE id = $1 AND NOT EXISTS (
         SELECT 1 FROM team_members WHERE team_id = $1
       )`,
      [teamId]
    );
  }
}
