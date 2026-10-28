export type RiddleStatus = "unvisited" | "solved" | "visited";

export interface RiddleCard {
  position: number;
  status: RiddleStatus;
  text: string | null;
  /**
   * The riddle has a picture, served from `GET /events/:id/riddles/:position/image`.
   * Like `text`, only true once the card is revealed (active, solved or visited).
   */
  hasImage: boolean;
}

export interface RiddlesResponse {
  eventId: string;
  teamId: string;
  riddles: RiddleCard[];
  activeRiddle: number | null;
}

/** One of the 6 riddle positions as admins edit it. Unset fields are null / []. */
export interface AdminRiddle {
  position: number;
  text: string | null;
  /** Accepted answers; any one is correct (matched leniently). */
  answers: string[];
  locationName: string | null;
  /** Encoded in the location's QR code as `/scan/<qrIdentifier>`. */
  qrIdentifier: string | null;
  /** Has a picture, previewed via `GET /events/:id/admin/riddles/:position/image`. */
  hasImage: boolean;
}

export interface ScanResponse {
  locationName: string;
  /** True when the team had already scanned this location; nothing was awarded. */
  alreadyScanned: boolean;
  /** Points earned at this location (the original award when `alreadyScanned`). */
  points: number;
  /** The team's total score after this scan. */
  totalScore: number;
  progress: RiddlesResponse;
}
