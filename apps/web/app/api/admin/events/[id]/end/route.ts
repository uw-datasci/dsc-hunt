import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Ends the hunt. The API enforces staff-only (403) and the live -> ended
 * transition (409 otherwise). There is no restart.
 */
export const POST = withRaft<Ctx>(async (request, { params }) => {
  const { id } = await params;
  return forward(request, `/events/${encodeURIComponent(id)}/end`);
});
