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
  progress: RiddlesResponse;
}
