import type { RiddleStatus } from "@dsc-hunt/types";

export interface ProgressRow {
  position: number;
  status: RiddleStatus;
  text: string | null;
  has_image: boolean;
  location_name: string | null;
  active_riddle: number | null;
}

export interface TeamStateRow {
  team_id: string;
  active_riddle: number | null;
  riddle_1: RiddleStatus;
  riddle_2: RiddleStatus;
  riddle_3: RiddleStatus;
  riddle_4: RiddleStatus;
  riddle_5: RiddleStatus;
  riddle_6: RiddleStatus;
}

export interface AnswerAttemptRow {
  active_riddle: number | null;
  status: RiddleStatus;
  cooling_down: boolean;
}

export interface LocationRow {
  location_id: string;
  name: string;
  position: number;
}

export interface PriorVisitRow {
  points: number;
  total_score: number;
}

export interface EventParams {
  id: string;
}

export interface RiddleParams extends EventParams {
  position: number;
}

export interface CurrentRiddleParams {
  position: number;
}

export interface ScanParams extends EventParams {
  code: string;
}

export interface CurrentScanParams {
  code: string;
}

export interface AnswerBody {
  answer: string;
}
