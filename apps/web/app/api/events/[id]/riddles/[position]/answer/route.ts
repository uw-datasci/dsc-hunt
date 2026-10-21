import { proxyApi } from "@/lib/api/proxy";

export async function POST(
  request: Request,
  context: Readonly<{ params: Promise<{ id: string; position: string }> }>
) {
  const { id, position } = await context.params;
  return proxyApi(
    `/events/${encodeURIComponent(id)}/riddles/${encodeURIComponent(position)}/answer`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    }
  );
}
