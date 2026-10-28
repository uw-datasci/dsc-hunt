import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Every team with member / scan / score counts. Staff only (enforced by the API). */
export const GET = withRaft<Ctx>(async (request, { params }) => {
  const { id } = await params;
  return forward(request, `/events/${encodeURIComponent(id)}/admin/teams`);
});
