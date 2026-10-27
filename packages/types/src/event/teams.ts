/** A team in a hunt. Players join with its 5-digit `code`. */
export interface Team {
  id: string;
  eventId: string;
  code: string;
  name: string;
  createdAt: string;
}

export interface TeamMember {
  userId: string;
  /** Captured from the player's profile when they joined. */
  displayName: string;
  joinedAt: string;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
}
