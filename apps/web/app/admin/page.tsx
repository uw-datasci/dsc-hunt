import Link from "next/link";
import type { EventStats } from "@dsc-hunt/types";
import { AdminLiveProvider } from "@/components/admin/admin-live";
import { AdminShell } from "@/components/admin/admin-shell";
import { CreateEventDialog } from "@/components/admin/create-event-dialog";
import { DashboardStats } from "@/components/admin/dashboard-stats";
import { GameControls } from "@/components/admin/game-controls";
import { proxyApiJson } from "@/lib/api/proxy";
import { getAccessToken } from "@/lib/auth/session";
import { getCurrentEvent } from "@/lib/event/current";

export const dynamic = "force-dynamic";

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

function SectionLinks() {
  return (
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
  );
}

export default async function AdminHomePage() {
  const [event, accessToken] = await Promise.all([getCurrentEvent(), getAccessToken()]);

  if (!event) {
    return (
      <AdminShell
        title="Dashboard"
        actions={
          <div className="flex flex-col items-end gap-1">
            <CreateEventDialog />
            <p className="text-xs text-muted-foreground">
              If creation fails, check the API is running and migrations are applied.
            </p>
          </div>
        }
      >
        <SectionLinks />
      </AdminShell>
    );
  }

  const { data } = await proxyApiJson<{ stats: EventStats }>(
    `/events/${encodeURIComponent(event.id)}/admin/stats`,
    { cache: "no-store" }
  );

  return (
    <AdminLiveProvider
      key={event.id}
      event={event}
      initialStats={data?.stats ?? null}
      accessToken={accessToken}
    >
      <AdminShell title="Dashboard" actions={<GameControls />}>
        <DashboardStats />
        <SectionLinks />
      </AdminShell>
    </AdminLiveProvider>
  );
}
