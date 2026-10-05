import type { Event, Team } from "@dsc-hunt/types";

export interface MeRecord {
  userId: string;
  team: Team | null;
  event: Event | null;
}
