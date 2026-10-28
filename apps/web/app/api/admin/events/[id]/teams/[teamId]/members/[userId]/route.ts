import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

type Ctx = { params: Promise<{ id: string; teamId: string; userId: string }> };

/** Remove a player from a team. Staff only (enforced by the API). */
export const DELETE = withRaft<Ctx>(async (request, { params }) => {
  const { id, teamId, userId } = await params;
  return forward(
    request,
    `/events/${encodeURIComponent(id)}/admin/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`
  );
});
