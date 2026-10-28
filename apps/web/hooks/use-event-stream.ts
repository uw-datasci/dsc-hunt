"use client";

import { useEffect, useRef, useState } from "react";
import type { EventStatus, ServerMessage } from "@dsc-hunt/types";
import { clientConfig } from "@/config/client";

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

export type EventStatusMessage = ServerMessage & { type: "event_status" };
export type TeamProgressMessage = ServerMessage & { type: "team_progress" };
export type TeamMembersMessage = ServerMessage & { type: "team_members" };
export type ScoreUpdateMessage = ServerMessage & { type: "score_update" };
export type EventStatsMessage = ServerMessage & { type: "event_stats" };

interface UseEventStreamOptions {
  /** Pass null to stay disconnected (e.g. no event yet). */
  eventId: string | null;
  /**
   * Supabase access token from `getAccessToken()`. Null stays disconnected
   * unless `allowAnonymous` is set.
   */
  accessToken: string | null;
  /**
   * Connect without a token too (public pages like the leaderboard). The
   * server then sends only event-wide messages: status and scores.
   */
  allowAnonymous?: boolean;
  /** Server-rendered status, shown until the connect-time snapshot arrives. */
  initialStatus?: EventStatus | null;
  onEventStatus?: (msg: EventStatusMessage) => void;
  /** Only `team_progress` / `team_members` messages for this team reach the callbacks below. */
  teamId?: string | null;
  onTeamProgress?: (msg: TeamProgressMessage) => void;
  /** A player joined or left this team. */
  onTeamMembers?: (msg: TeamMembersMessage) => void;
  /** Any team's score changed (leaderboard). */
  onScoreUpdate?: (msg: ScoreUpdateMessage) => void;
  /** Dashboard counters + start readiness. The server only sends these to staff. */
  onEventStats?: (msg: EventStatsMessage) => void;
  /**
   * Every message, unfiltered (after the typed callbacks). For staff views that
   * react to any team's activity, e.g. refetching the admin live view.
   */
  onMessage?: (msg: ServerMessage) => void;
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
  allowAnonymous = false,
  initialStatus = null,
  onEventStatus,
  teamId = null,
  onTeamProgress,
  onTeamMembers,
  onScoreUpdate,
  onEventStats,
  onMessage,
}: UseEventStreamOptions): EventStatus | null {
  const [status, setStatus] = useState<EventStatus | null>(initialStatus);

  // Keep the latest callback without making it a dependency of the
  // connection effect - callers would otherwise reconnect on every render.
  const onEventStatusRef = useRef(onEventStatus);
  const onTeamProgressRef = useRef(onTeamProgress);
  const onTeamMembersRef = useRef(onTeamMembers);
  const onScoreUpdateRef = useRef(onScoreUpdate);
  const onEventStatsRef = useRef(onEventStats);
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onEventStatusRef.current = onEventStatus;
    onTeamProgressRef.current = onTeamProgress;
    onTeamMembersRef.current = onTeamMembers;
    onScoreUpdateRef.current = onScoreUpdate;
    onEventStatsRef.current = onEventStats;
    onMessageRef.current = onMessage;
  }, [onEventStatus, onTeamProgress, onTeamMembers, onScoreUpdate, onEventStats, onMessage]);

  useEffect(() => {
    if (!eventId || (!accessToken && !allowAnonymous)) return;

    const url = new URL(`/events/${encodeURIComponent(eventId)}/stream`, clientConfig.apiUrl);
    if (accessToken) url.searchParams.set("access_token", accessToken);

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
        switch (msg.type) {
          case "event_status":
            setStatus(msg.status);
            onEventStatusRef.current?.(msg);
            break;
          case "team_progress":
            // The server only sends our team's progress; the check is a second guard.
            if (teamId && msg.teamId === teamId) onTeamProgressRef.current?.(msg);
            break;
          case "team_members":
            if (teamId && msg.teamId === teamId) onTeamMembersRef.current?.(msg);
            break;
          case "score_update":
            onScoreUpdateRef.current?.(msg);
            break;
          case "event_stats":
            onEventStatsRef.current?.(msg);
            break;
          default:
            break;
        }
        onMessageRef.current?.(msg);
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
  }, [eventId, accessToken, allowAnonymous, teamId]);

  return status;
}
