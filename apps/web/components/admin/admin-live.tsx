"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { Event, EventStats, EventStatus } from "@dsc-hunt/types";
import {
  useEventStream,
  type EventStatsMessage,
  type EventStatusMessage,
} from "@/hooks/use-event-stream";

interface AdminLiveValue {
  readonly event: Event;
  readonly status: EventStatus;
  /** Null if the stats request failed; stream updates fill it in. */
  readonly stats: EventStats | null;
  readonly accessToken: string | null;
  /** Lets an action (e.g. Start) apply its result before the stream echoes it. */
  readonly setStatus: (status: EventStatus) => void;
}

const AdminLiveContext = createContext<AdminLiveValue | null>(null);

interface AdminLiveProviderProps {
  readonly event: Event;
  readonly initialStats: EventStats | null;
  readonly accessToken: string | null;
  readonly children: React.ReactNode;
}

/**
 * One event stream for the admin dashboard, shared by the start/end controls
 * and the stat tiles: status changes plus staff-only `event_stats`.
 */
export function AdminLiveProvider({
  event,
  initialStats,
  accessToken,
  children,
}: AdminLiveProviderProps) {
  const [status, setStatus] = useState<EventStatus>(event.status);
  const [stats, setStats] = useState(initialStats);

  const onEventStatus = useCallback((msg: EventStatusMessage) => setStatus(msg.status), []);
  const onEventStats = useCallback((msg: EventStatsMessage) => setStats(msg.stats), []);

  useEventStream({
    eventId: event.id,
    accessToken,
    initialStatus: event.status,
    onEventStatus,
    onEventStats,
  });

  return (
    <AdminLiveContext.Provider value={{ event, status, stats, accessToken, setStatus }}>
      {children}
    </AdminLiveContext.Provider>
  );
}

export function useAdminLive(): AdminLiveValue {
  const value = useContext(AdminLiveContext);
  if (!value) throw new Error("useAdminLive must be used inside <AdminLiveProvider>");
  return value;
}
