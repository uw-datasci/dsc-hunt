import Link from "next/link";
import { redirect } from "next/navigation";
import type { LeaderboardEntry, TeamVisit } from "@dsc-hunt/types";
import { Card, CardContent, CardHeader, CardTitle } from "@dsc-hunt/ui/components/card";
import { Podium } from "@/components/leaderboard/podium";
import { PageShell } from "@/components/shared/page-shell";
import { StatTile } from "@/components/shared/stat-tile";
import { proxyApiJson } from "@/lib/api/proxy";
import { getCurrentEvent } from "@/lib/event/current";
import { getCurrentTeam } from "@/lib/team/current";

export const dynamic = "force-dynamic";

/** Matches the API's fixed number of riddle positions. */
const TOTAL_RIDDLES = 6;

export default async function FinishedPage() {
  const event = await getCurrentEvent();
  if (event?.status === "live") redirect("/riddles");
  if (event?.status !== "ended") redirect("/team");

  const eventPath = `/events/${encodeURIComponent(event.id)}`;
  const [team, leaderboardResult] = await Promise.all([
    getCurrentTeam(event),
    proxyApiJson<{ leaderboard: LeaderboardEntry[] }>(`${eventPath}/leaderboard`, {
      cache: "no-store",
    }),
  ]);
  const visitsResult = team
    ? await proxyApiJson<{ visits: TeamVisit[] }>(`${eventPath}/team/visits`, {
        cache: "no-store",
      })
    : null;

  const leaderboard = leaderboardResult.data?.leaderboard ?? [];
  const visits = visitsResult?.data?.visits ?? [];
  const entry = team ? leaderboard.find((row) => row.teamId === team.id) : undefined;

  return (
    <PageShell
      width="max-w-2xl"
      eyebrow={team?.name ?? event.name}
      title="The hunt is over"
      description="Thanks for playing! Enjoy your candy. 🍬"
    >
      {team ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Found" value={`${visits.length} / ${TOTAL_RIDDLES}`} />
            <StatTile label="Score" value={entry?.totalScore ?? 0} />
            <StatTile
              label="Rank"
              value={entry ? `#${entry.rank} of ${leaderboard.length}` : "—"}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-base">Points by location</CardTitle>
              </CardHeader>
              <CardContent>
                {visits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No locations found.</p>
                ) : (
                  <ul className="grid gap-1 text-sm">
                    {visits.map((visit) => (
                      <li key={visit.position} className="flex justify-between gap-2">
                        <span>
                          <span className="text-muted-foreground">
                            Riddle {visit.position} ·{" "}
                          </span>
                          {visit.locationName}
                        </span>
                        <span className="font-semibold tabular-nums">+{visit.points}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-base">Teammates</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-1 text-sm">
                  {team.members.map((member) => (
                    <li key={member.userId}>👻 {member.displayName}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          You didn&apos;t join a team this time. Here&apos;s how everyone did.
        </p>
      )}

      <section className="grid gap-3" aria-labelledby="final-standings">
        <h2 id="final-standings" className="text-center text-2xl">
          Final standings
        </h2>
        {leaderboardResult.data ? (
          <Podium entries={leaderboard} highlightTeamId={team?.id ?? null} />
        ) : (
          <p role="alert" className="text-center text-sm text-destructive">
            {leaderboardResult.error ?? "Couldn't load the standings."}
          </p>
        )}
      </section>

      <Link
        href="/"
        className="text-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to home
      </Link>
    </PageShell>
  );
}
