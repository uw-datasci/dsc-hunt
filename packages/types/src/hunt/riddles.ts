export type RiddleStatus = "unvisited" | "solved" | "visited";

export interface RiddleCard {
  position: number;
  status: RiddleStatus;
  text: string | null;
}

export interface RiddlesResponse {
  eventId: string;
  teamId: string;
  riddles: RiddleCard[];
  activeRiddle: number | null;
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
