import type { Event, EventStatus } from "@dsc-hunt/types";

export interface CreateEventInput {
  name: string;
  durationMinutes: number;
  teamSizeCap?: number;
  questionCount?: number;
  submissionCap?: number;
}

export interface UpdateEventInput {
  name?: string;
  startsAt?: string | null;
  durationMinutes?: number;
  teamSizeCap?: number;
  questionCount?: number;
  submissionCap?: number;
  status?: EventStatus;
  endsAt?: string | null;
  pausedAt?: string | null;
}

export interface EventRow {
  id: string;
  name: string;
  starts_at: string | null;
  duration_minutes: number;
  team_size_cap: number;
  question_count: number;
  submission_cap: number;
  status: Event["status"];
  created_at: string;
  ends_at: string | null;
  paused_at: string | null;
}

export interface EventStatsRow {
  question_count: string;
  player_count: string;
  team_count: string;
  avg_answered: string;
  finished_count: string;
}
