import { proxyApi } from "@/lib/api/proxy";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: Readonly<{ params: Promise<{ id: string }> }>
) {
  const { id } = await context.params;
  return proxyApi(`/teams/${encodeURIComponent(id)}`);
}
