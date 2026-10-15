"use client";

import { useEffect, useRef, useState } from "react";
import type { EventStatus, ServerMessage } from "@dsc-hunt/types";
import { clientConfig } from "@/config/client";

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

export type EventStatusMessage = ServerMessage & { type: "event_status" };

interface UseEventStreamOptions {
  /** Pass null to stay disconnected (e.g. no event yet). */
  eventId: string | null;
  /** Supabase access token from `getAccessToken()`; null stays disconnected. */
  accessToken: string | null;
  /** Server-rendered status, shown until the connect-time snapshot arrives. */
  initialStatus?: EventStatus | null;
  onEventStatus?: (msg: EventStatusMessage) => void;
}

/**
 * Opens an SSE connection to the Fastify API for one event and tracks its
 * status. EventSource cannot send Authorization headers, so the token goes
 * in the query string.
 *
 * Reconnects: the browser retries transient drops on its own, but gives up
 * (readyState CLOSED) when the server answers non-2xx or refuses the
 * connection - e.g. while the API restarts. We reopen with exponential
 * backoff so clients recover without a refresh. The server sends a status
 * snapshot on every (re)connect, so no update is missed while offline.
 *
 * Caveat: reconnects reuse the token the page rendered with. A token that
 * has expired by then is refreshed on the next full navigation.
 */
export function useEventStream({
  eventId,
  accessToken,
  initialStatus = null,
  onEventStatus,
}: UseEventStreamOptions): EventStatus | null {
  const [status, setStatus] = useState<EventStatus | null>(initialStatus);

  // Keep the latest callback without making it a dependency of the
  // connection effect - callers would otherwise reconnect on every render.
  const onEventStatusRef = useRef(onEventStatus);
  useEffect(() => {
    onEventStatusRef.current = onEventStatus;
  }, [onEventStatus]);

  useEffect(() => {
    if (!eventId || !accessToken) return;

    const url = new URL(`/events/${encodeURIComponent(eventId)}/stream`, clientConfig.apiUrl);
    url.searchParams.set("access_token", accessToken);

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let backoff = INITIAL_BACKOFF_MS;
    let disposed = false;

    function connect() {
      if (disposed) return;
      const es = new EventSource(url.toString());
      source = es;

      es.onopen = () => {
        backoff = INITIAL_BACKOFF_MS;
      };

      es.onmessage = (ev) => {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(ev.data) as ServerMessage;
        } catch {
          return;
        }
        if (msg.type === "event_status") {
          setStatus(msg.status);
          onEventStatusRef.current?.(msg);
        }
      };

      es.onerror = () => {
        if (es.readyState !== EventSource.CLOSED) return; // browser is retrying
        es.close();
        if (source === es) source = null;
        retryTimer = setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      };
    }

    connect();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
    };
  }, [eventId, accessToken]);

  return status;
}
