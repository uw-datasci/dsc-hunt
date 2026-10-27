import { proxyApi } from "@/lib/api/proxy";

export async function DELETE(
  _request: Request,
  context: Readonly<{ params: Promise<{ id: string }> }>
) {
  const { id } = await context.params;
  return proxyApi(`/teams/${encodeURIComponent(id)}/members/me`, { method: "DELETE" });
}
