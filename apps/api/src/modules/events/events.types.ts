import type { EventStatus } from "@dsc-hunt/types";

export interface EventRow {
  id: string;
  name: string;
  status: EventStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}
