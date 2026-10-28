import type { EventStatus } from "@dsc-hunt/types";

export interface AdminRiddleRow {
  position: number;
  riddle_text: string | null;
  answers: string[] | null;
  location_name: string | null;
  qr_identifier: string | null;
  has_image: boolean;
}

/** An uploaded file as the controller read it; `truncated` means it hit the size limit. */
export interface UploadedImage {
  data: Buffer;
  truncated: boolean;
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
