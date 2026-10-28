import { proxyApi } from "@/lib/api/proxy";
import { passThroughRedirect } from "@/lib/api/redirect";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; position: string }> };

async function imagePath({ params }: Context): Promise<string> {
  const { id, position } = await params;
  return `/events/${encodeURIComponent(id)}/admin/riddles/${encodeURIComponent(position)}/image`;
}

/** Admin preview: redirects to a short-lived signed URL. Staff only (enforced by the API). */
export async function GET(_request: Request, context: Context) {
  return passThroughRedirect(
    await proxyApi(await imagePath(context), { redirect: "manual", cache: "no-store" })
  );
}

/** Uploads the image. The multipart body is forwarded as-is with its boundary. */
export async function POST(request: Request, context: Context) {
  return proxyApi(await imagePath(context), {
    method: "POST",
    headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    body: await request.arrayBuffer(),
  });
}

export async function DELETE(_request: Request, context: Context) {
  return proxyApi(await imagePath(context), { method: "DELETE" });
}
