import { proxyApi } from "@/lib/api/proxy";
import { passThroughRedirect } from "@/lib/api/redirect";

export const dynamic = "force-dynamic";

/**
 * A revealed riddle's image. The API checks the player's team has the card
 * revealed and redirects to a short-lived signed URL on Neon Object Storage.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; position: string }> }
) {
  const { id, position } = await params;
  return passThroughRedirect(
    await proxyApi(
      `/events/${encodeURIComponent(id)}/riddles/${encodeURIComponent(position)}/image`,
      { redirect: "manual", cache: "no-store" }
    )
  );
}
