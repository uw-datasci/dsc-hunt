import { proxyApi } from "@/lib/api/proxy";

/** Remove a player from a team. Staff only (enforced by the API). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; teamId: string; userId: string }> }
) {
  const { id, teamId, userId } = await params;
  return proxyApi(
    `/events/${encodeURIComponent(id)}/admin/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
}
