import Link from "next/link";
import type { Event, EventStatus } from "@dsc-hunt/types";
import { Button } from "@dsc-hunt/ui/components/button";
import { StartingLocationCard } from "@/components/event/starting-location-card";

export interface LandingSession {
  name: string | null;
  isStaff: boolean;
  eventStatus: EventStatus;
}

/** Where "Enter the hunt" goes for each status. /riddles bounces to /team when the player has no team. */
const ENTRY_HREF: Record<EventStatus, string> = {
  not_started: "/team",
  live: "/riddles",
  ended: "/finished",
};

interface LandingHeroProps {
  loginUrl: string;
  session: LandingSession | null;
  /** Current hunt, for the kickoff venue (shown before the start). */
  event: Event | null;
}

export function LandingHero({ loginUrl, session, event }: Readonly<LandingHeroProps>) {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          UW Data Science Club
        </p>
        <h1 className="mt-3 text-5xl text-primary sm:text-6xl">DSC Hunt</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Solve the riddles, haunt the campus, collect the candy. 🎃
        </p>

        <div className="mt-6 empty:hidden">
          <StartingLocationCard event={event} />
        </div>

        {session ? (
          <div className="mt-10 space-y-4">
            {session.name ? (
              <p className="text-center text-sm text-muted-foreground">
                Signed in as {session.name}
              </p>
            ) : null}
            <Button asChild className="w-full">
              <Link href={ENTRY_HREF[session.eventStatus]}>Enter the hunt</Link>
            </Button>
            {session.isStaff ? (
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin">Admin</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="mt-10 space-y-3">
            <Button asChild size="lg" className="w-full">
              <a href={loginUrl}>Sign in</a>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Use your UW Data Science Club account to join.
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-sm">
          <Link
            href="/leaderboard"
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            View the leaderboard
          </Link>
        </p>
      </div>
    </div>
  );
}
