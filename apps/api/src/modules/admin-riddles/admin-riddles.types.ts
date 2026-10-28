import type { EventStatus } from "@dsc-hunt/types";

export interface AdminRiddleRow {
  position: number;
  riddle_text: string | null;
  answers: string[] | null;
  location_name: string | null;
  qr_identifier: string | null;
}

export interface EventLockRow {
  status: EventStatus;
}

export interface RiddleParams {
  id: string;
  position: number;
}

export interface SaveRiddleBody {
  text: string;
  answers: string[];
  locationName: string;
}
