import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";
import { proxyApi } from "@/lib/api/proxy";
import { passThroughRedirect } from "@/lib/api/redirect";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; position: string }> };

async function imagePath({ params }: Ctx): Promise<string> {
  const { id, position } = await params;
  return `/events/${encodeURIComponent(id)}/admin/riddles/${encodeURIComponent(position)}/image`;
}

/** Admin preview: redirects to a short-lived signed URL. Staff only (enforced by the API). */
export const GET = withRaft<Ctx>(async (_request, context) => {
  return passThroughRedirect(
    await proxyApi(await imagePath(context), { redirect: "manual", cache: "no-store" })
  );
});

/** Uploads the image. The multipart body is forwarded as-is with its boundary. */
export const POST = withRaft<Ctx>(async (request, context) => {
  return forward(request, await imagePath(context), { timeoutMs: 30_000 });
});

export const DELETE = withRaft<Ctx>(async (request, context) => {
  return forward(request, await imagePath(context));
});
