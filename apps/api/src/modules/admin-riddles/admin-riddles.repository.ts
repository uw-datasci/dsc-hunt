import { query, type DatabaseTransaction } from "@dsc-hunt/db";
import type { AdminRiddle } from "@dsc-hunt/types";
import type { AdminRiddleRow, EventLockRow } from "./admin-riddles.types";

function rowToRiddle(row: AdminRiddleRow): AdminRiddle {
  return {
    position: Number(row.position),
    text: row.riddle_text,
    answers: row.answers ?? [],
    locationName: row.location_name,
    qrIdentifier: row.qr_identifier,
    hasImage: Boolean(row.has_image),
  };
}

export class AdminRiddlesRepository {
  /** All 6 positions for an event, configured or not. */
  async list(eventId: string): Promise<AdminRiddle[]> {
    const rows = await query<AdminRiddleRow>(
      `SELECT positions.position,
              riddles.riddle_text,
              riddles.answers,
              locations.name AS location_name,
              locations.qr_identifier,
              (riddles.image_key IS NOT NULL) AS has_image
       FROM generate_series(1, 6) AS positions(position)
       LEFT JOIN riddles
         ON riddles.event_id = $1 AND riddles.position = positions.position
       LEFT JOIN locations
         ON locations.event_id = $1 AND locations.position = positions.position
       ORDER BY positions.position`,
      [eventId]
    );
    return rows.map(rowToRiddle);
  }

  /** Locks the event row for the rest of the transaction; null if it doesn't exist. */
  async lockEvent(tx: DatabaseTransaction, eventId: string): Promise<EventLockRow | null> {
    const [row] = await tx.query<EventLockRow>(
      `SELECT status FROM events WHERE id = $1 FOR UPDATE`,
      [eventId]
    );
    return row ?? null;
  }

  /**
   * Creates or updates the riddle and its location at a position. A new
   * location gets `newQrIdentifier`; an existing one keeps its code.
   */
  async upsert(
    tx: DatabaseTransaction,
    input: {
      eventId: string;
      position: number;
      text: string;
      answers: string[];
      locationName: string;
      newQrIdentifier: string;
    }
  ): Promise<AdminRiddle> {
    const [riddle] = await tx.query<{ riddle_id: string; image_key: string | null }>(
      `INSERT INTO riddles (event_id, position, riddle_text, answers)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (event_id, position)
       DO UPDATE SET riddle_text = EXCLUDED.riddle_text, answers = EXCLUDED.answers
       RETURNING riddle_id, image_key`,
      [input.eventId, input.position, input.text, input.answers]
    );
    if (!riddle) throw new Error("Riddle upsert returned no row");

    const [location] = await tx.query<{ name: string; qr_identifier: string }>(
      `INSERT INTO locations (event_id, position, riddle_id, name, qr_identifier)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (event_id, position)
       DO UPDATE SET name = EXCLUDED.name, riddle_id = EXCLUDED.riddle_id
       RETURNING name, qr_identifier`,
      [
        input.eventId,
        input.position,
        riddle.riddle_id,
        input.locationName,
        input.newQrIdentifier,
      ]
    );
    if (!location) throw new Error("Location upsert returned no row");

    return {
      position: input.position,
      text: input.text,
      answers: input.answers,
      locationName: location.name,
      qrIdentifier: location.qr_identifier,
      hasImage: riddle.image_key !== null,
    };
  }

  /**
   * Locks the riddle row at a position and returns its current image key
   * (`{ image_key: null }` when it has none). Null when the riddle isn't saved yet.
   */
  async lockImage(
    tx: DatabaseTransaction,
    eventId: string,
    position: number
  ): Promise<{ image_key: string | null } | null> {
    const [row] = await tx.query<{ image_key: string | null }>(
      `SELECT image_key FROM riddles WHERE event_id = $1 AND position = $2 FOR UPDATE`,
      [eventId, position]
    );
    return row ?? null;
  }

  async setImageKey(
    tx: DatabaseTransaction,
    eventId: string,
    position: number,
    imageKey: string | null
  ): Promise<void> {
    await tx.query(`UPDATE riddles SET image_key = $3 WHERE event_id = $1 AND position = $2`, [
      eventId,
      position,
      imageKey,
    ]);
  }

  async findImageKey(eventId: string, position: number): Promise<string | null> {
    const [row] = await query<{ image_key: string | null }>(
      `SELECT image_key FROM riddles WHERE event_id = $1 AND position = $2`,
      [eventId, position]
    );
    return row?.image_key ?? null;
  }

  /** Replaces a location's QR code. Returns null if the position has no location. */
  async setQrIdentifier(
    tx: DatabaseTransaction,
    eventId: string,
    position: number,
    qrIdentifier: string
  ): Promise<string | null> {
    const [row] = await tx.query<{ qr_identifier: string }>(
      `UPDATE locations SET qr_identifier = $3
       WHERE event_id = $1 AND position = $2
       RETURNING qr_identifier`,
      [eventId, position, qrIdentifier]
    );
    return row?.qr_identifier ?? null;
  }
}
