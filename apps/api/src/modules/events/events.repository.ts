import { query, queryOne } from "@dsc-hunt/db";
import type { Event, EventStatus } from "@dsc-hunt/types";
import type { EventRow } from "./events.types";

export class EventsRepository {
  private static rowToEvent(row: EventRow): Event {
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      teamSizeCap: row.team_size_cap,
      createdAt: row.created_at,
    };
  }

  async findById(id: string): Promise<Event | null> {
    const row = await queryOne<EventRow>(`SELECT * FROM events WHERE id = $1`, [id]);
    return row ? EventsRepository.rowToEvent(row) : null;
  }

  /** The newest event. The app runs one hunt at a time. */
  async findCurrent(): Promise<Event | null> {
    const row = await queryOne<EventRow>(
      `SELECT * FROM events ORDER BY created_at DESC, id DESC LIMIT 1`
    );
    return row ? EventsRepository.rowToEvent(row) : null;
  }

  /**
   * Atomic status transition: only updates when the row is still in `from`,
   * so two admins clicking at once can't both succeed. Returns null when the
   * row is missing or not in `from`.
   */
  async transition(id: string, from: EventStatus, to: EventStatus): Promise<Event | null> {
    const rows = await query<EventRow>(
      `UPDATE events
       SET status = $3,
           started_at = CASE WHEN $3 = 'live' THEN now() ELSE started_at END,
           ended_at   = CASE WHEN $3 = 'ended' THEN now() ELSE ended_at END
       WHERE id = $1 AND status = $2
       RETURNING *`,
      [id, from, to]
    );
    const row = rows[0];
    return row ? EventsRepository.rowToEvent(row) : null;
  }
}
