"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { EventStatus } from "@dsc-hunt/types";
import { useEventStream, type EventStatusMessage } from "@/hooks/use-event-stream";

interface EventStatusRedirectProps {
  readonly eventId: string;
  readonly accessToken: string | null;
  readonly initialStatus: EventStatus;
  /** Where to send the player when the hunt enters each status. */
  readonly redirects: Partial<Record<EventStatus, string>>;
}

/**
 * Renders nothing. Subscribes to the event stream and navigates the moment
 * the status changes to one in `redirects` - e.g. pushing /riddles to
 * /finished when an admin ends the hunt. The server-side redirect on the
 * page still runs on a fresh load; this covers players already on the page.
 */
export function EventStatusRedirect({
  eventId,
  accessToken,
  initialStatus,
  redirects,
}: EventStatusRedirectProps) {
  const router = useRouter();

  const onEventStatus = useCallback(
    (msg: EventStatusMessage) => {
      const href = redirects[msg.status];
      if (href) router.replace(href);
    },
    [router, redirects]
  );

  useEventStream({ eventId, accessToken, initialStatus, onEventStatus });

  return null;
}
