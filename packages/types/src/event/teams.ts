import type { Profile } from "../auth/user.js";

export interface Team {
  id: string;
  eventId: string;
  code: string;
  name: string | null;
  createdAt: string;
}

export interface TeamMember {
  userId: string;
  teamId: string;
  eventId: string;
  joinedAt: string;
}

export interface TeamWithMembers extends Team {
  members: Array<TeamMember & { profile: Profile | null }>;
}
