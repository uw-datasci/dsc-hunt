import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Sets the starting location (event venue). The API enforces staff-only (403)
 * and that the hunt hasn't started (409).
 */
export const PUT = withRaft<Ctx>(async (request, { params }) => {
  const { id } = await params;
  return forward(request, `/events/${encodeURIComponent(id)}/starting-location`);
});
