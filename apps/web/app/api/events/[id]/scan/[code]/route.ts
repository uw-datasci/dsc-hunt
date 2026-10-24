import { proxyApi } from "@/lib/api/proxy";

export async function POST(
  _request: Request,
  context: Readonly<{ params: Promise<{ id: string; code: string }> }>
) {
  const { id, code } = await context.params;
  return proxyApi(`/events/${encodeURIComponent(id)}/scan/${encodeURIComponent(code)}`, {
    method: "POST",
  });
}
