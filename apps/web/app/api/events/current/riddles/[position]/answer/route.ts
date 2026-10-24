import { proxyApi } from "@/lib/api/proxy";

export async function POST(
  request: Request,
  context: Readonly<{ params: Promise<{ position: string }> }>
) {
  const { position } = await context.params;
  return proxyApi(`/events/current/riddles/${encodeURIComponent(position)}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
