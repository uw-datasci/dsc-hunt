import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

type Ctx = { params: Promise<{ id: string; teamId: string }> };

async function teamPath({ params }: Ctx): Promise<string> {
  const { id, teamId } = await params;
  return `/events/${encodeURIComponent(id)}/admin/teams/${encodeURIComponent(teamId)}`;
}

/** Rename a team. Staff only (enforced by the API). */
export const PATCH = withRaft<Ctx>(async (request, context) => {
  return forward(request, await teamPath(context));
});

/** Delete a team. Staff only, before the start (enforced by the API). */
export const DELETE = withRaft<Ctx>(async (request, context) => {
  return forward(request, await teamPath(context));
});
