import { proxyApi } from "@/lib/api/proxy";

type Context = { params: Promise<{ id: string; teamId: string }> };

async function teamPath({ params }: Context): Promise<string> {
  const { id, teamId } = await params;
  return `/events/${encodeURIComponent(id)}/admin/teams/${encodeURIComponent(teamId)}`;
}

/** Rename a team. Staff only (enforced by the API). */
export async function PATCH(request: Request, context: Context) {
  return proxyApi(await teamPath(context), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}

/** Delete a team. Staff only, before the start (enforced by the API). */
export async function DELETE(_request: Request, context: Context) {
  return proxyApi(await teamPath(context), { method: "DELETE" });
}
