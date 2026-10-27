import { proxyApi } from "@/lib/api/proxy";

export async function POST(
  request: Request,
  context: Readonly<{ params: Promise<{ id: string }> }>
) {
  const { id } = await context.params;
  return proxyApi(`/events/${encodeURIComponent(id)}/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Fastify rejects an empty JSON body, and the team name is optional.
    body: (await request.text()) || "{}",
  });
}
