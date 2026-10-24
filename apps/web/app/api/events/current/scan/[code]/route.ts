import { proxyApi } from "@/lib/api/proxy";

export async function POST(
  _request: Request,
  context: Readonly<{ params: Promise<{ code: string }> }>
) {
  const { code } = await context.params;
  return proxyApi(`/events/current/scan/${encodeURIComponent(code)}`, { method: "POST" });
}
