import { proxyApi } from "@/lib/api/proxy";

export async function POST(
  _request: Request,
  context: Readonly<{ params: Promise<{ position: string }> }>
) {
  const { position } = await context.params;
  return proxyApi(`/events/current/riddles/${encodeURIComponent(position)}/flip`, {
    method: "POST",
  });
}
