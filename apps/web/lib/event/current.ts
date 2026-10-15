import "server-only";

import { cache } from "react";
import type { Event } from "@dsc-hunt/types";
import { proxyApiJson } from "@/lib/api/proxy";

/**
 * The current hunt, as the API sees it (`GET /events/current`). Null when
 * there is no event yet, the caller isn't signed in, or the API is
 * unreachable - callers treat null as "not started".
 *
 * Wrapped in React's `cache()` so a layout and page rendering in the same
 * request share one round trip.
 */
export const getCurrentEvent = cache(async (): Promise<Event | null> => {
  try {
    const { data } = await proxyApiJson<{ event: Event }>("/events/current", {
      cache: "no-store",
    });
    return data?.event ?? null;
  } catch {
    return null;
  }
});
