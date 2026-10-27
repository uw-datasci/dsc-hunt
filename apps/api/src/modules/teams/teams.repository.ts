import { query, queryOne, withTransaction } from "@dsc-hunt/db";
import type { Team, TeamMember } from "@dsc-hunt/types";
import type { AddMemberResult, EventStatsRow, TeamMemberRow, TeamRow } from "./teams.types";

const TEAM_COLUMNS = `teams.team_id, teams.event_id, teams.code, teams.team_name, teams.created_at`;

export class TeamsRepository {
  private static rowToTeam(row: TeamRow): Team {
    return {
      id: row.team_id,
      eventId: row.event_id,
      code: row.code,
      name: row.team_name,
      createdAt: row.created_at,
    };
  }

  private static rowToMember(row: TeamMemberRow): TeamMember {
    return { userId: row.user_id, displayName: row.display_name, joinedAt: row.joined_at };
  }

  async findById(teamId: string): Promise<Team | null> {
    const row = await queryOne<TeamRow>(
      `SELECT ${TEAM_COLUMNS} FROM teams WHERE team_id = $1`,
      [teamId]
    );
    return row ? TeamsRepository.rowToTeam(row) : null;
  }

  async findByCode(eventId: string, code: string): Promise<Team | null> {
    const row = await queryOne<TeamRow>(
      `SELECT ${TEAM_COLUMNS} FROM teams WHERE event_id = $1 AND code = $2`,
      [eventId, code]
    );
    return row ? TeamsRepository.rowToTeam(row) : null;
  }

  /** The user's team for an event, if any. */
  async getTeamForUser(userId: string, eventId: string): Promise<Team | null> {
    const row = await queryOne<TeamRow>(
      `SELECT ${TEAM_COLUMNS}
       FROM teams
       JOIN team_members ON team_members.team_id = teams.team_id
       WHERE team_members.user_id = $1 AND team_members.event_id = $2`,
      [userId, eventId]
    );
    return row ? TeamsRepository.rowToTeam(row) : null;
  }

  async isMember(teamId: string, userId: string): Promise<boolean> {
    const row = await queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2
       ) AS exists`,
      [teamId, userId]
    );
    return row?.exists ?? false;
  }

  async listMembers(teamId: string): Promise<TeamMember[]> {
    const rows = await query<TeamMemberRow>(
      `SELECT user_id, display_name, joined_at
       FROM team_members
       WHERE team_id = $1
       ORDER BY joined_at ASC, user_id ASC`,
      [teamId]
    );
    return rows.map(TeamsRepository.rowToMember);
  }

  /** Creates a team and adds its creator as the first member, atomically. */
  createWithCreator(input: {
    eventId: string;
    code: string;
    name: string;
    creatorUserId: string;
    creatorDisplayName: string;
  }): Promise<Team> {
    return withTransaction(async (tx) => {
      const [row] = await tx.query<TeamRow>(
        `INSERT INTO teams (event_id, code, team_name)
         VALUES ($1, $2, $3)
         RETURNING team_id, event_id, code, team_name, created_at`,
        [input.eventId, input.code, input.name]
      );
      if (!row) throw new Error("Insert team returned no row");
      await tx.query(
        `INSERT INTO team_members (team_id, event_id, user_id, display_name)
         VALUES ($1, $2, $3, $4)`,
        [row.team_id, input.eventId, input.creatorUserId, input.creatorDisplayName]
      );
      return TeamsRepository.rowToTeam(row);
    });
  }

  /**
   * Adds a member unless the team is full. The team row is locked so two
   * players racing for the last spot can't both get in.
   */
  addMember(input: {
    teamId: string;
    eventId: string;
    userId: string;
    displayName: string;
    sizeCap: number;
  }): Promise<AddMemberResult> {
    return withTransaction(async (tx) => {
      const locked = await tx.query(`SELECT team_id FROM teams WHERE team_id = $1 FOR UPDATE`, [
        input.teamId,
      ]);
      if (locked.length === 0) return "missing";

      const [count] = await tx.query<{ count: number }>(
        `SELECT count(*)::integer AS count FROM team_members WHERE team_id = $1`,
        [input.teamId]
      );
      if ((count?.count ?? 0) >= input.sizeCap) return "full";

      await tx.query(
        `INSERT INTO team_members (team_id, event_id, user_id, display_name)
         VALUES ($1, $2, $3, $4)`,
        [input.teamId, input.eventId, input.userId, input.displayName]
      );
      return "added";
    });
  }

  /**
   * Removes a member and deletes the team if nobody is left. Locks the team
   * row like `addMember`, so a join can't land on a team being deleted.
   */
  removeMember(teamId: string, userId: string): Promise<void> {
    return withTransaction(async (tx) => {
      await tx.query(`SELECT team_id FROM teams WHERE team_id = $1 FOR UPDATE`, [teamId]);
      await tx.query(`DELETE FROM team_members WHERE team_id = $1 AND user_id = $2`, [
        teamId,
        userId,
      ]);
      await tx.query(
        `DELETE FROM teams
         WHERE team_id = $1
           AND NOT EXISTS (SELECT 1 FROM team_members WHERE team_id = $1)`,
        [teamId]
      );
    });
  }

  async stats(eventId: string): Promise<{ teamCount: number; playerCount: number }> {
    const row = await queryOne<EventStatsRow>(
      `SELECT
         (SELECT count(*) FROM teams WHERE event_id = $1)::integer AS team_count,
         (SELECT count(*) FROM team_members WHERE event_id = $1)::integer AS player_count`,
      [eventId]
    );
    return { teamCount: row?.team_count ?? 0, playerCount: row?.player_count ?? 0 };
  }
}
