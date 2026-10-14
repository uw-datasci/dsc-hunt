"use client";

import { useEffect, useState } from "react";
import type { EventStatus } from "@/lib/event/types";

/** Subscribes to live event status over SSE; EventSource auto-reconnects. */
export function useEventStream(initialStatus: EventStatus): EventStatus {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const source = new EventSource("/api/event/stream");
    source.onmessage = (message) => {
      const data = JSON.parse(message.data) as { status: EventStatus };
      setStatus(data.status);
    };
    return () => source.close();
  }, []);

  return status;
}
