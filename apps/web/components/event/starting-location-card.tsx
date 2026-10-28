import type { Event } from "@dsc-hunt/types";

interface StartingLocationCardProps {
  readonly event: Event | null;
}

/**
 * The venue where the event is held and the hunt is introduced. Only shown
 * before the hunt starts, and only once an admin has set it.
 */
export function StartingLocationCard({ event }: StartingLocationCardProps) {
  if (!event || event.status !== "not_started" || !event.startingLocationName) return null;

  return (
    <div className="rounded-xl border border-primary/40 bg-card p-4 text-center">
      <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Hunt kickoff</p>
      <p className="mt-1 text-lg font-semibold">📍 {event.startingLocationName}</p>
      {event.startingLocationDetails ? (
        <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
          {event.startingLocationDetails}
        </p>
      ) : null}
    </div>
  );
}
