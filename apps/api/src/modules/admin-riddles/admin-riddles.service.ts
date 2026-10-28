import { randomBytes } from "node:crypto";
import { withTransaction, type DatabaseTransaction } from "@dsc-hunt/db";
import type { AdminRiddle } from "@dsc-hunt/types";
import { HttpError } from "../../lib/http-error";
import type { EventsRepository } from "../events/events.repository";
import { normalizeAnswer } from "../riddles/answer-match";
import { SIGNED_URL_SECONDS, type ObjectStorage } from "../../plugins/storage";
import type { AdminRiddlesRepository } from "./admin-riddles.repository";
import type { SaveRiddleBody, UploadedImage } from "./admin-riddles.types";
import { riddleImageKey, sniffImageType } from "./riddle-image";

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
    private readonly events: EventsRepository,
    private readonly storage: ObjectStorage | null = null
  ) {}

  /**
   * Stores a new image for a saved riddle, replacing any previous one. Only
   * JPEG/PNG/WebP/GIF up to 5 MB, detected from the bytes. The old object is
   * deleted after the new key is committed.
   */
  async uploadImage(
    eventId: string,
    position: number,
    file: UploadedImage | undefined
  ): Promise<{ hasImage: true }> {
    const storage = this.requireStorage();
    // Size first: an oversized upload arrives as an empty, truncated buffer.
    if (file?.truncated) throw new HttpError(413, "Images can be at most 5 MB");
    if (!file || file.data.length === 0) throw new HttpError(400, "Choose an image to upload");
    const type = sniffImageType(file.data);
    if (!type) throw new HttpError(400, "Only JPEG, PNG, WebP or GIF images are allowed");

    const key = riddleImageKey(eventId, position, type.extension);
    let uploaded = false;
    let previousKey: string | null;
    try {
      previousKey = await this.withEditableEvent(eventId, async (tx) => {
        const current = await this.repository.lockImage(tx, eventId, position);
        if (!current) throw new HttpError(404, "Save this riddle before adding an image");
        await storage.put(key, file.data, type.contentType);
        uploaded = true;
        await this.repository.setImageKey(tx, eventId, position, key);
        return current.image_key;
      });
    } catch (error) {
      // The key never got saved, so don't leave the object behind.
      if (uploaded) await storage.delete(key).catch(() => undefined);
      throw error;
    }
    if (previousKey) await storage.delete(previousKey).catch(() => undefined);
    return { hasImage: true };
  }

  async removeImage(eventId: string, position: number): Promise<{ hasImage: false }> {
    const storage = this.requireStorage();
    const previousKey = await this.withEditableEvent(eventId, async (tx) => {
      const current = await this.repository.lockImage(tx, eventId, position);
      if (!current) throw new HttpError(404, "Riddle not found");
      await this.repository.setImageKey(tx, eventId, position, null);
      return current.image_key;
    });
    if (previousKey) await storage.delete(previousKey).catch(() => undefined);
    return { hasImage: false };
  }

  /** A short-lived signed URL for the admin preview (works in any event status). */
  async imageUrl(eventId: string, position: number): Promise<string> {
    const storage = this.requireStorage();
    const key = await this.repository.findImageKey(eventId, position);
    if (!key) throw new HttpError(404, "This riddle has no image");
    return storage.signedGetUrl(key, SIGNED_URL_SECONDS);
  }

  private requireStorage(): ObjectStorage {
    if (!this.storage) throw new HttpError(503, "Image storage isn't configured");
    return this.storage;
  }

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
