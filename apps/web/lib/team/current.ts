import "server-only";

import { cache } from "react";
import type { Event, TeamWithMembers } from "@dsc-hunt/types";
import { proxyApiJson } from "@/lib/api/proxy";

/**
 * The signed-in player's team for an event (`GET /events/:id/team`). Null
 * when there is no event, the player hasn't joined a team, or the API is
 * unreachable.
 *
 * Wrapped in React's `cache()` so a layout and page rendering in the same
 * request share one round trip.
 */
export const getCurrentTeam = cache(
  async (event: Event | null): Promise<TeamWithMembers | null> => {
    if (!event) return null;
    try {
      const { data } = await proxyApiJson<{ team: TeamWithMembers | null }>(
        `/events/${encodeURIComponent(event.id)}/team`,
        { cache: "no-store" }
      );
      return data?.team ?? null;
    } catch {
      return null;
    }
  }
);
