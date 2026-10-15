import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { GameControls } from "@/components/admin/game-controls";
import { StatTile } from "@/components/shared/stat-tile";
import { getAccessToken } from "@/lib/auth/session";
import { getCurrentEvent } from "@/lib/event/current";

export const dynamic = "force-dynamic";

// TODO: replace with real counts.
const PLACEHOLDER_STATS = [
  { label: "Teams", value: 0 },
  { label: "Players", value: 0 },
  { label: "Locations", value: 0 },
  { label: "Scans", value: 0 },
];

const SECTIONS = [
  { href: "/admin/teams", title: "Teams", description: "Registered teams and their members." },
  {
    href: "/admin/riddles",
    title: "Riddles",
    description: "Riddles, their locations, and the QR codes to print.",
  },
  {
    href: "/admin/live",
    title: "Live",
    description: "Team progress and scans as they happen.",
  },
];

export default async function AdminHomePage() {
  const [event, accessToken] = await Promise.all([getCurrentEvent(), getAccessToken()]);

  return (
    <AdminShell
      title="Dashboard"
      actions={
        event ? (
          <GameControls event={event} accessToken={accessToken} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No event found. Check the API is running and migrations have been applied.
          </p>
        )
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PLACEHOLDER_STATS.map((stat) => (
          <StatTile key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-xl border bg-card p-4 transition-colors hover:border-primary"
          >
            <p className="font-semibold">{section.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
