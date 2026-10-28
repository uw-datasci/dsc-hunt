import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Live progress for the admin view. Staff only (enforced by the API). */
export const GET = withRaft<Ctx>(async (request, { params }) => {
  const { id } = await params;
  return forward(request, `/events/${encodeURIComponent(id)}/admin/progress`, {
    init: { cache: "no-store" },
  });
});
