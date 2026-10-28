import Link from "next/link";
import type { LeaderboardEntry } from "@dsc-hunt/types";
import { cn } from "@dsc-hunt/ui/lib/utils";

const MEDALS = ["🥇", "🥈", "🥉"];

interface PodiumProps {
  readonly entries: LeaderboardEntry[];
  /** The player's team, highlighted (and shown below the podium if it's not in the top 3). */
  readonly highlightTeamId?: string | null;
}

function Row({
  entry,
  label,
  highlighted,
}: {
  entry: LeaderboardEntry;
  label: string;
  highlighted: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-4 rounded-xl border bg-card px-4 py-3",
        highlighted && "border-primary bg-primary/10"
      )}
    >
      <span className="w-10 text-center font-heading text-2xl" aria-hidden={label.length <= 2}>
        {label}
      </span>
      <span className="flex-1 font-medium">
        {entry.name}
        {highlighted ? <span className="ml-2 text-xs text-primary">(your team)</span> : null}
      </span>
      <span className="font-semibold tabular-nums">{entry.totalScore}</span>
    </li>
  );
}

/** Final standings: top 3 with medals, plus the player's own row if they placed lower. */
export function Podium({ entries, highlightTeamId = null }: PodiumProps) {
  if (entries.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">No teams took part.</p>;
  }

  const top = entries.slice(0, 3);
  const own = highlightTeamId
    ? entries.find((entry) => entry.teamId === highlightTeamId)
    : null;
  const ownBelowPodium = own && own.rank > 3 ? own : null;

  return (
    <div className="grid gap-3">
      <ol className="grid gap-2" aria-label="Top teams">
        {top.map((entry, index) => (
          <Row
            key={entry.teamId}
            entry={entry}
            label={MEDALS[index] ?? `#${entry.rank}`}
            highlighted={entry.teamId === highlightTeamId}
          />
        ))}
      </ol>
      {ownBelowPodium ? (
        <>
          <p className="text-center text-xs text-muted-foreground" aria-hidden>
            ⋯
          </p>
          <ol aria-label="Your team">
            <Row entry={ownBelowPodium} label={`#${ownBelowPodium.rank}`} highlighted />
          </ol>
        </>
      ) : null}
      <Link
        href="/leaderboard"
        className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        See the full leaderboard
      </Link>
    </div>
  );
}
