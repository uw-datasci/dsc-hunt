import { randomBytes } from "node:crypto";

export interface ImageType {
  contentType: string;
  extension: string;
}

/**
 * Detects JPEG / PNG / GIF / WebP from the file's first bytes. The declared
 * content type is ignored: only the bytes decide, so a renamed file can't
 * slip through. Returns null for anything else.
 */
export function sniffImageType(bytes: Buffer): ImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { contentType: "image/png", extension: "png" };
  }
  if (bytes.length >= 6) {
    const header = bytes.subarray(0, 6).toString("ascii");
    if (header === "GIF87a" || header === "GIF89a") {
      return { contentType: "image/gif", extension: "gif" };
    }
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { contentType: "image/webp", extension: "webp" };
  }
  return null;
}

/** A fresh object key per upload, so replaced images never collide or cache-stick. */
export function riddleImageKey(eventId: string, position: number, extension: string): string {
  return `events/${eventId}/riddles/${position}/${randomBytes(8).toString("hex")}.${extension}`;
}
