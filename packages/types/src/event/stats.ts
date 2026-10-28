/** Live counters + start readiness for the admin dashboard (staff only). */
export interface EventStats {
  teamCount: number;
  playerCount: number;
  /** Positions with riddle text, at least one answer, and a location with a QR code. */
  configuredRiddles: number;
  totalRiddles: number;
  /** Successful QR scans (visits) across all teams. */
  scanCount: number;
  startingLocationSet: boolean;
  /** Why the hunt can't start yet; empty when it's ready. */
  startBlockers: string[];
}
