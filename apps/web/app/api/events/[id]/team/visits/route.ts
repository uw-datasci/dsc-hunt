import { proxyApi } from "@/lib/api/proxy";

export const dynamic = "force-dynamic";

/** The caller's team's scans with points (results screen). */
export async function GET(
  _request: Request,
  context: Readonly<{ params: Promise<{ id: string }> }>
) {
  const { id } = await context.params;
  return proxyApi(`/events/${encodeURIComponent(id)}/team/visits`);
}
