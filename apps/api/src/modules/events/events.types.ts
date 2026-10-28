import type { EventStatus } from "@dsc-hunt/types";

export interface EventRow {
  id: string;
  name: string;
  status: EventStatus;
  started_at: string | null;
  ended_at: string | null;
  team_size_cap: number;
  starting_location_name: string | null;
  starting_location_details: string | null;
  created_at: string;
}
