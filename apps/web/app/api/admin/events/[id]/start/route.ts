import { withRaft } from "@uw-datasci/raft";
import { forward } from "@/lib/api/forward";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Starts the hunt. The API enforces staff-only (403) and the
 * not_started -> live transition (409 otherwise).
 */
export const POST = withRaft<Ctx>(async (request, { params }) => {
  const { id } = await params;
  return forward(request, `/events/${encodeURIComponent(id)}/start`);
});
