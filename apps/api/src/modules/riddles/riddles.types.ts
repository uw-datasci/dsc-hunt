import type { RiddleStatus } from "@dsc-hunt/types";

export interface ProgressRow {
  position: number;
  status: RiddleStatus;
  text: string | null;
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

export interface LocationRow {
  location_id: string;
  name: string;
  position: number;
}
