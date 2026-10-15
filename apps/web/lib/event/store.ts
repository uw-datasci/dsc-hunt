import "server-only";

export type EventStatus = "not_started" | "live" | "ended";

type Listener = (status: EventStatus) => void;

interface EventState {
  status: EventStatus;
  listeners: Set<Listener>;
}

// TODO: move to the API/DB; in-memory state is per-process and lost on restart.
const globalState = globalThis as unknown as { __eventState?: EventState };
const state: EventState = (globalState.__eventState ??= {
  status: "not_started",
  listeners: new Set(),
});

export function getEventStatus(): EventStatus {
  return state.status;
}

export function setEventStatus(status: EventStatus): void {
  state.status = status;
  for (const listener of state.listeners) listener(status);
}

export function subscribeEventStatus(listener: Listener): () => void {
  state.listeners.add(listener);
  return () => state.listeners.delete(listener);
}
