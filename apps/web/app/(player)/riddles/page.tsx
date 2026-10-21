import { redirect } from "next/navigation";
import type { RiddlesResponse } from "@dsc-hunt/types";
import { EventStatusRedirect } from "@/components/event/event-status-redirect";
import { PageShell } from "@/components/shared/page-shell";
import { serverConfig } from "@/config/server";
import { proxyApiJson } from "@/lib/api/proxy";
import { getAccessToken } from "@/lib/auth/session";
import { getCurrentEvent } from "@/lib/event/current";
import { getCurrentTeam } from "@/lib/team/session";
import { RiddleBoard } from "./riddle-board";

export const dynamic = "force-dynamic";

export default async function HuntPage() {
  const [team, event, accessToken] = await Promise.all([
    getCurrentTeam(),
    getCurrentEvent(),
    getAccessToken(),
  ]);
  if (event?.status === "ended") redirect("/finished");
  if (!team || event?.status !== "live") redirect("/team");

  const { data, error } = await proxyApiJson<RiddlesResponse>(
    `/events/${encodeURIComponent(event.id)}/riddles`
  );

  return (
    <PageShell
      width="max-w-2xl"
      eyebrow={team.name}
      title="Your riddles"
      description="Reveal one riddle at a time, then solve it to unlock its location."
    >
      {/* Push players to the results screen the moment an admin ends the hunt. */}
      <EventStatusRedirect
        eventId={event.id}
        accessToken={accessToken}
        initialStatus={event.status}
        redirects={{ ended: "/finished" }}
      />
      {data ? (
        <RiddleBoard
          initialProgress={data}
          supabaseUrl={serverConfig.supabaseUrl}
          supabasePublishableKey={serverConfig.supabasePublishableKey}
        />
      ) : (
        <p role="alert" className="text-center text-sm text-destructive">
          {error ?? "Unable to load riddles."}
        </p>
      )}
    </PageShell>
  );
}
