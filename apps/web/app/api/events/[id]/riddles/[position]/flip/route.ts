import { proxyApi } from "@/lib/api/proxy";

export async function POST(
  _request: Request,
  context: Readonly<{ params: Promise<{ id: string; position: string }> }>
) {
  const { id, position } = await context.params;
  return proxyApi(
    `/events/${encodeURIComponent(id)}/riddles/${encodeURIComponent(position)}/flip`,
    { method: "POST" }
  );
}
