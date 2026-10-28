import { redirect } from "next/navigation";
import type { RiddlesResponse } from "@dsc-hunt/types";
import { EventStatusRedirect } from "@/components/event/event-status-redirect";
import { PageShell } from "@/components/shared/page-shell";
import { proxyApiJson } from "@/lib/api/proxy";
import { getAccessToken } from "@/lib/auth/session";
import { getCurrentEvent } from "@/lib/event/current";
import { getCurrentTeam } from "@/lib/team/current";
import { RiddleBoard } from "./riddle-board";

export const dynamic = "force-dynamic";

export default async function HuntPage() {
  const event = await getCurrentEvent();
  const [team, accessToken] = await Promise.all([getCurrentTeam(event), getAccessToken()]);
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
      {/* The board also sends players to /finished the moment an admin ends the hunt. */}
      {data ? (
        <RiddleBoard
          initialProgress={data}
          accessToken={accessToken}
          initialStatus={event.status}
        />
      ) : (
        <>
          <EventStatusRedirect
            eventId={event.id}
            accessToken={accessToken}
            initialStatus={event.status}
            redirects={{ ended: "/finished" }}
          />
          <p role="alert" className="text-center text-sm text-destructive">
            {error ?? "Unable to load riddles."}
          </p>
        </>
      )}
    </PageShell>
  );
}
