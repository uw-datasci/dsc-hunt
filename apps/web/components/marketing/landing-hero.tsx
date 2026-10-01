import Link from "next/link";
import { Button } from "@dsc-hunt/ui/components/button";

export interface LandingSession {
  name: string | null;
  isStaff: boolean;
}

interface LandingHeroProps {
  loginUrl: string;
  session: LandingSession | null;
}

export function LandingHero({ loginUrl, session }: Readonly<LandingHeroProps>) {
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

        {session ? (
          <div className="mt-10 space-y-4">
            {session.name ? (
              <p className="text-center text-sm text-muted-foreground">
                Signed in as {session.name}
              </p>
            ) : null}
            {/* TODO: route by state - /team (no team), /waiting, /hunt, or /finished. */}
            <Button asChild className="w-full">
              <Link href="/team">Enter the hunt</Link>
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
      </div>
    </div>
  );
}
