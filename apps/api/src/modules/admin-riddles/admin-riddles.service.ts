import { randomBytes } from "node:crypto";
import { withTransaction, type DatabaseTransaction } from "@dsc-hunt/db";
import type { AdminRiddle } from "@dsc-hunt/types";
import { HttpError } from "../../lib/http-error";
import type { EventsRepository } from "../events/events.repository";
import { normalizeAnswer } from "../riddles/answer-match";
import type { AdminRiddlesRepository } from "./admin-riddles.repository";
import type { SaveRiddleBody } from "./admin-riddles.types";

const QR_ATTEMPTS = 5;
const QR_TAKEN = "locations_qr_identifier_key";

/** Random, URL-safe and hard to guess (12 chars), so codes can't be typed in to skip a location. */
function generateQrIdentifier(): string {
  return randomBytes(9).toString("base64url");
}

function isQrCollision(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { code, constraint } = error as { code?: string; constraint?: string };
  return code === "23505" && constraint === QR_TAKEN;
}

/** Trims answers and drops ones that match an earlier answer once normalized. */
function cleanAnswers(answers: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const raw of answers) {
    const answer = raw.trim();
    const key = normalizeAnswer(answer);
    if (!key) throw new HttpError(400, `"${answer}" has no letters or numbers to match on`);
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(answer);
  }
  return cleaned;
}

export class AdminRiddlesService {
  constructor(
    private readonly repository: AdminRiddlesRepository,
    private readonly events: EventsRepository
  ) {}

  async list(eventId: string): Promise<AdminRiddle[]> {
    if (!(await this.events.findById(eventId))) throw new HttpError(404, "Event not found");
    return this.repository.list(eventId);
  }

  async save(eventId: string, position: number, body: SaveRiddleBody): Promise<AdminRiddle> {
    const text = body.text.trim();
    const locationName = body.locationName.trim();
    if (!text) throw new HttpError(400, "Riddle text is required");
    if (!locationName) throw new HttpError(400, "Location name is required");
    const answers = cleanAnswers(body.answers);

    return this.withEditableEvent(eventId, (tx) =>
      this.repository.upsert(tx, {
        eventId,
        position,
        text,
        answers,
        locationName,
        newQrIdentifier: generateQrIdentifier(),
      })
    );
  }

  /** Issues a new QR code for a position; previously printed codes stop working. */
  async regenerateQr(eventId: string, position: number): Promise<{ qrIdentifier: string }> {
    const qrIdentifier = await this.withEditableEvent(eventId, (tx) =>
      this.repository.setQrIdentifier(tx, eventId, position, generateQrIdentifier())
    );
    if (!qrIdentifier) throw new HttpError(404, "Save this riddle before generating a QR code");
    return { qrIdentifier };
  }

  /**
   * Runs `work` in a transaction that holds the event row, so the hunt can't
   * start mid-edit. Edits are only allowed before the start. Retries on the
   * (very unlikely) QR code collision, which aborts the transaction.
   */
  private async withEditableEvent<T>(
    eventId: string,
    work: (tx: DatabaseTransaction) => Promise<T>
  ): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await withTransaction(async (tx) => {
          const event = await this.repository.lockEvent(tx, eventId);
          if (!event) throw new HttpError(404, "Event not found");
          if (event.status !== "not_started") {
            throw new HttpError(409, "Riddles are locked once the hunt starts");
          }
          return work(tx);
        });
      } catch (error) {
        if (isQrCollision(error) && attempt < QR_ATTEMPTS) continue;
        throw error;
      }
    }
  }
}
