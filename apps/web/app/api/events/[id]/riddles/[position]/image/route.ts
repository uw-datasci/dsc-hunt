import { withRaft } from "@uw-datasci/raft";
import { proxyApi } from "@/lib/api/proxy";
import { passThroughRedirect } from "@/lib/api/redirect";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; position: string }> };

/**
 * A revealed riddle's image. The API checks the player's team has the card
 * revealed and redirects to a short-lived signed URL on Neon Object Storage.
 */
export const GET = withRaft<Ctx>(async (_request, { params }) => {
  const { id, position } = await params;
  return passThroughRedirect(
    await proxyApi(
      `/events/${encodeURIComponent(id)}/riddles/${encodeURIComponent(position)}/image`,
      { redirect: "manual", cache: "no-store" }
    )
  );
});
